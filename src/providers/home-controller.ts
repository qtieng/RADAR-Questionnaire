import { Injectable } from '@angular/core';
import { StorageService } from './storage-service'
import { SchedulingService } from './scheduling-service'
import { Task, TasksProgress } from '../models/task'
import { Assessment } from '../models/assessment'
import { NotificationService } from './notification-service'
import { StorageKeys } from '../enums/storage'

@Injectable()
export class HomeController {

  constructor(private storage: StorageService,
              private schedule: SchedulingService,
              private notifications: NotificationService) {
  }

  evalEnrolement() {
    return this.storage.getAllKeys().then((keys) => {
      return keys.length <= 5
    })
  }

  getAssessment (task) {
    return this.storage.getAssessment(task)
  }

  getClinicalAssessment (task) {
    return this.storage.getClinicalAssessment(task)
  }

  updateAssessmentIntroduction (assessment) {
    if(assessment.showIntroduction){
      var assessmentUpdated = assessment
      assessmentUpdated.showIntroduction = false
      this.storage.updateAssessment(assessmentUpdated)
    }
  }

  getTasksOfToday () {
    let now = new Date()
    return this.schedule.getTasksForDate(now)
  }

  getTasksOfDate (timestamp) {
    return this.schedule.getTasksForDate(timestamp)
  }

  getTaskProgress () {
    return this.getTasksOfToday()
      .then((tasks:Task[]) => this.retrieveTaskProgress(tasks))
  }

  getClinicalTasks () {
    return this.storage.get(StorageKeys.CONFIG_CLINICAL_ASSESSMENTS)
  }

  setNextNotificationsForXDays (periodInDays) {
    let today = new Date().getTime()
    let day = 86400000
    var promises = []
    for(var i = 0; i < periodInDays; i++) {
      promises.push(this.getTasksOfDate(new Date(today + day*i)))
    }
    Promise.all(promises)
    .then((tasks) => {
      let mergedTasks = [].concat.apply([], tasks)
      this.notifications.setNotifications(mergedTasks)
    })

  }

  retrieveTaskProgress (tasks):TasksProgress {
    var tasksProgress: TasksProgress = {
      numberOfTasks: 0,
      completedTasks: 0
    }
    if(tasks) {
      tasksProgress.numberOfTasks = tasks.length
      for(var i = 0; i<tasks.length;i++){
        if(tasks[i].completed){
          tasksProgress.completedTasks +=1
        }
      }
    return tasksProgress
    }
  }

  getNextTask () {
    return this.getTasksOfToday()
            .then((tasks:Task[]) => this.retrieveNextTask(tasks))
  }

  areAllTasksComplete() {
    return this.getTasksOfToday()
    .then((tasks: Task[]) => {
      return this.checkIfAllTasksComplete(tasks)
    })
  }

  retrieveNextTask (tasks):Task {
    if(tasks) {
      let now = new Date()
      let offsetTime = 1000 * 60 * 10 // 10 min
      let timestamp = new Date().getTime() - offsetTime
      var passedAtLeastOnce = false
      var nextIdx = 0
      var nextTimestamp = timestamp + 1000 * 60 * 60 * 12
      for(var i = 0; i < tasks.length; i++){
        if(tasks[i].timestamp >= timestamp &&
            tasks[i].timestamp < nextTimestamp &&
            tasks[i].completed == false){
          passedAtLeastOnce = true
          nextTimestamp = tasks[i].timestamp
          nextIdx = i
        }
      }
      if(passedAtLeastOnce) {
        console.log('NEXT TASK')
        console.log(tasks[nextIdx])
        return tasks[nextIdx]
      }
    }
  }

  checkIfAllTasksComplete(tasks: Task[]) {
    var status = true
    if(tasks){
      for(var i = 0; i<tasks.length; i++) {
        if(tasks[i].completed == false) {
          status = false
        }
      }
    }
    return status
  }

  updateTaskToComplete (task):Promise<any> {
    var updatedTask = task
    updatedTask.completed = true
    return this.schedule.insertTask(updatedTask)
  }
}
