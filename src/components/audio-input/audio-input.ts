
import { Component, Input, OnInit, Output, EventEmitter, OnChanges } from '@angular/core'
import { Device } from '@ionic-native/device'
import { NavController, AlertController } from 'ionic-angular'
import * as opensmile from '../../../plugins/cordova-plugin-opensmile/www/opensmile' //file path to opensmile.js; Adding opensmile plugin
import { AnswerService } from '../../providers/answer-service'
import { QuestionsPage } from '../../pages/questions/questions'
import { AudioRecordService } from '../../providers/audiorecord-service'
import { AndroidPermissionUtility } from '../../utilities/android-permission'
import { Answer } from '../../models/answer'
import { Section } from '../../models/question'

declare var cordova: any
declare var window: any

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.html'
})

export class AudioInputComponent implements OnInit, OnChanges {
  @Output() valueChange: EventEmitter<any> = new EventEmitter<any>()
  @Input() sections: Section[]
  @Input() currentlyShown: boolean

  filename: string
  name: string
  filepath: string
  recording: boolean
  value: string = null
  configFile: string = 'liveinput_android.conf'
  compression: number = 1
  platform: boolean = false
  answer_b64: string = null
  permission: any

  answer: Answer = {
    id: null,
    value: null,
    type: 'audio'
  }

  ngOnInit() {

  }

  ngOnChanges() {
    if(this.currentlyShown) {
      this.startRecording()
    }
  }


  constructor(
    public questions: QuestionsPage,
    private answerService: AnswerService,
    private audioRecordService: AudioRecordService,
    private permissionUtil: AndroidPermissionUtility,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private device: Device) {

    //Stop audio recording when application is on pause / backbutton is pressed
    document.addEventListener('pause', () => {
      console.log("on pause")
      //if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      //}
    });

    document.addEventListener("backbutton", () => {
      console.log("on backbutton")
      //if (this.navCtrl.isActive(this.navCtrl.getActive()) == false) {
      this.audioRecordService.stopAudioRecording()
      //}
    });

    this.permissionUtil.checkPermissions()

  }

  startRecording() {
    this.permissionUtil.getRecordAudio_Permission().then((success) => {
      if (success == true) {
        this.audioRecordService.startAudioRecording(this.configFile)
      }
    })
  }


  isRecording() {
    return this.audioRecordService.getAudioRecordStatus()
  }

  setText() {
    if (this.audioRecordService.getAudioRecordStatus()) {
      return 'Stop Recording'
    } else {
      return 'Start Recording'
    }
  }

  showAlert(title, message) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: message,
      buttons: ['Dismiss']
    });
    alert.present();
  }

}
