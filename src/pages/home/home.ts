import { Component, ViewChild, ElementRef} from '@angular/core'
import { NavController, AlertController, Content } from 'ionic-angular'
import { SchedulingService } from '../../providers/scheduling-service'
import { HomeController } from '../../providers/home-controller'
import { Task, TasksProgress } from '../../models/task'
import { EnrolmentPage } from '../enrolment/enrolment'
import { StartPage } from '../start/start'
import { QuestionsPage } from '../questions/questions'
import { SettingsPage } from '../settings/settings'
import { ClinicalTasksPage } from '../clinical-tasks/clinical-tasks'
import { DefaultTask } from '../../assets/data/defaultConfig'
import { LocKeys } from '../../enums/localisations'
import { TranslatePipe } from '../../pipes/translate/translate'
import { StorageService } from '../../providers/storage-service'
import { StorageKeys } from '../../enums/storage'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('content')
  elContent: Content
  elContentHeight: number
  @ViewChild('progressBar')
  elProgress: ElementRef;
  elProgressHeight: number
  @ViewChild('tickerBar')
  elTicker: ElementRef;
  elTickerHeight: number
  @ViewChild('taskInfo')
  elInfo: ElementRef;
  elInfoHeight: number
  @ViewChild('footer')
  elFooter: ElementRef;
  elFooterHeight: number
  @ViewChild('taskCalendar')
  elCalendar: ElementRef

  isOpenPageClicked: boolean = false
  nextTask: Task = DefaultTask
  showCalendar: boolean = false
  showCompleted: boolean = false
  showNoTasksToday: boolean = false
  tasksProgress: TasksProgress
  calendarScrollHeight: number = 0
  hasClickedStartButton: boolean = true
  hasClinicalTasks = false
  hasOnlyESMs = false

  constructor (
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private schedule: SchedulingService,
    private controller: HomeController,
    private translate: TranslatePipe,
    private storage: StorageService,
  ) {  }

  ngAfterViewInit(){
  }

  ionViewDidLoad () {
    this.checkForNextTask()
    this.evalHasClinicalTasks()
    this.checkIfOnlyESM()
    setInterval(() => {
      this.checkForNextTask()
    }, 1000)
    setTimeout(() => {
      this.controller.setNextNotificationsForXDays(43)
    }, 1000)
  }

  checkForNextTask () {
    if(!this.showCalendar){
      this.controller.getNextTask().then((task) => {
        this.checkForNextTaskGeneric(task)
      })
    }
  }

  checkForNextTaskGeneric(task) {
    if(task){
      this.nextTask = task
      this.hasClickedStartButton = false
      this.displayCompleted(false)
      this.displayEvalTransformations(false)
    } else {
      this.controller.areAllTasksComplete().then((completed) => {
        if(completed) {
          this.nextTask = DefaultTask
          this.displayCompleted(true)
          if(!this.tasksProgress){
            this.showNoTasksToday = true
          }
        } else {
          this.nextTask = DefaultTask
          this.displayEvalTransformations(true)
        }
      })
    }
    console.log(this.nextTask)
  }

  checkIfOnlyESM() {
    this.controller.getTasksOfToday()
      .then((tasks) => {
        let tmpHasOnlyESMs = true
        for(var i = 0; i < tasks.length; i++){
          if(tasks[i].name != 'ESM'){
            tmpHasOnlyESMs = false
            break;
          }
        }
        this.hasOnlyESMs = tmpHasOnlyESMs
      })
  }

  evalHasClinicalTasks () {
    this.storage.get(StorageKeys.HAS_CLINICAL_TASKS)
    .then((isClinical) => {
      this.hasClinicalTasks = isClinical
    })
  }

  displayEvalTransformations (requestDisplay:boolean) {
    this.showCalendar = requestDisplay
    this.getElementsAttributes()
    this.applyTransformations()
  }

  displayCompleted (requestDisplay:boolean) {
    this.showCompleted = requestDisplay
    this.getElementsAttributes()
    this.applyCompletedTransformations()
  }

  getElementsAttributes () {
    this.elContentHeight = this.elContent.contentHeight
    this.elProgressHeight = this.elProgress.nativeElement.offsetHeight
    this.elTickerHeight = this.elTicker.nativeElement.offsetHeight
    this.elInfoHeight = this.elInfo.nativeElement.offsetHeight
    this.elFooterHeight = this.elFooter.nativeElement.offsetHeight
  }

  applyTransformations () {
    if(this.showCalendar){
      this.elProgress.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px) scale(0.5)`
      this.elTicker.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px)`
      this.elInfo.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px)`
      this.elFooter.nativeElement.style.transform =
        `translateY(${this.elFooterHeight}px) scale(0)`
      this.elCalendar.nativeElement.style.transform =
        `translateY(-${this.elProgressHeight}px)`
      this.elCalendar.nativeElement.style.opacity = 1
    } else {
      console.log('NEXT TASK EVAL')
      if(this.isNextTaskESMandNotNow()){
        this.elProgress.nativeElement.style.transform =
          `translateY(${this.elFooterHeight}px)`
        this.elTicker.nativeElement.style.transform =
          `translateY(${this.elFooterHeight}px)`
        this.elInfo.nativeElement.style.transform =
          `translateY(${this.elFooterHeight}px)`
        this.elFooter.nativeElement.style.transform =
          `translateY(${this.elFooterHeight}px) scale(0)`
        this.elCalendar.nativeElement.style.transform =
          'translateY(0px)'
        this.elCalendar.nativeElement.style.opacity = 0
      } else {
        console.log('DISPLAY START BUTTON')
        this.elProgress.nativeElement.style.transform =
          'translateY(0px) scale(1)'
        this.elTicker.nativeElement.style.transform =
          'translateY(0px)'
        this.elInfo.nativeElement.style.transform =
          'translateY(0px)'
        this.elFooter.nativeElement.style.transform =
          'translateY(0px) scale(1)'
        this.elCalendar.nativeElement.style.transform =
          'translateY(0px)'
        this.elCalendar.nativeElement.style.opacity = 0
      }
    }
    this.setCalendarScrollHeight(this.showCalendar)
  }

  isNextTaskESMandNotNow() {
    let now = new Date().getTime()
    if(this.nextTask.name == "ESM" && this.nextTask.timestamp > now){
      console.log('ESM - NOT NOW: true')
      return true
    }
    console.log('ESM - NOT NOW: false')
    return false
  }

  setCalendarScrollHeight (show:boolean) {
    if(show){
      this.calendarScrollHeight = this.elContentHeight
                                  - this.elTickerHeight
                                  - this.elInfoHeight
                                  - 80
    } else {
      this.calendarScrollHeight = 0
    }

  }

  applyCompletedTransformations () {
    if(this.showCompleted){
      this.elTicker.nativeElement.style.padding =
        `0`
      this.elTicker.nativeElement.style.transform =
        `translateY(${this.elInfoHeight+this.elFooterHeight}px)`
      this.elInfo.nativeElement.style.transform =
        `translateY(${this.elInfoHeight+this.elFooterHeight}px) scale(0)`
      this.elFooter.nativeElement.style.transform =
        `translateY(${this.elInfoHeight+this.elFooterHeight}px) scale(0)`
    } else {
      this.elTicker.nativeElement.style.padding =
        '0 0 2px 0'
      this.elTicker.nativeElement.style.transform =
        'translateY(0px)'
      this.elInfo.nativeElement.style.transform =
        'translateY(0px) scale(1)'
      this.elFooter.nativeElement.style.transform =
        'translateY(0px) scale(1)'
    }
  }

  openSettingsPage () {
    this.navCtrl.push(SettingsPage)
  }

  openClinicalTasksPage () {
    this.navCtrl.push(ClinicalTasksPage)
  }

  startQuestionnaire (task: Task) {
    this.hasClickedStartButton = true
    let startQuestionnaireTask = this.nextTask
    if(task){
      if(task.completed == false) {
        startQuestionnaireTask = task
      }
    }
    let lang = this.storage.get(StorageKeys.LANGUAGE)
    let nextAssessment = this.controller.getAssessment(startQuestionnaireTask)
    Promise.all([lang, nextAssessment])
    .then((res) => {
      let lang = res[0]
      let assessment = res[1]
      let params = {
        "title": assessment.name,
        "introduction": assessment.startText[lang.value],
        "endText": assessment.endText[lang.value],
        "questions": assessment.questions,
        "associatedTask": startQuestionnaireTask
      }
      if(assessment.showIntroduction){
        this.navCtrl.push(StartPage, params)
      } else {
        this.navCtrl.push(QuestionsPage, params)
      }
      this.controller.updateAssessmentIntroduction(assessment)
    })
  }

  showCredits () {
    let buttons = [
      {
        text: this.translate.transform(LocKeys.BTN_OKAY.toString()),
        handler: () => {
          console.log('Okay clicked');
        }
      }
    ]
    this.showAlert({
      'title': this.translate.transform(LocKeys.CREDITS_TITLE.toString()),
      'message': this.translate.transform(LocKeys.CREDITS_BODY.toString()),
      'buttons': buttons
    })
  }

  showAlert(parameters) {
    let alert = this.alertCtrl.create({
      title: parameters.title,
      buttons: parameters.buttons
    })
    if(parameters.message) {
      alert.setMessage(parameters.message)
    }
    if(parameters.inputs) {
      for(var i=0; i<parameters.inputs.length; i++){
        alert.addInput(parameters.inputs[i])
      }
    }
    alert.present()
  }

}
