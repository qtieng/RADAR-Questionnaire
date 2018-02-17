import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';
import { MediaCapture, CaptureAudioOptions, MediaFile, CaptureError} from '@ionic-native/media-capture';
import { Section } from '../../models/question'

let uniqueID = 0

export interface Item {
  id: string
  heading: string
  content: string
}

@Component({
  selector: 'audio-input',
  templateUrl: 'audio-input.html'
})
export class AudioInputComponent implements OnChanges{

  @Output() valueChange: EventEmitter<number> = new EventEmitter<number>()
  @Input() sections: Section[]
  @Input() currentlyShown: boolean

  value: number = null
  uniqueID: number = uniqueID++
  name = `info-${this.uniqueID}`
  items: Item[] = Array()

  constructor(private mediaCapture: MediaCapture) {}

  ngOnInit () {
    this.sections.map((item, i) => {
          this.items.push({
            id: `info-${this.uniqueID}-${i}`,
            heading: item.code,
            content: item.label
          })
        })

    // save timestamp (epoch) and activate the next button
    this.valueChange.emit((new Date).getTime())
  }

  ngOnChanges() {
    if(this.currentlyShown){
      let options: CaptureAudioOptions = { limit: 3, duration: 30 };
      this.mediaCapture.captureAudio(options)
        .then(
          (data: MediaFile[]) => console.log({'msg': 'MEDIAFILE', 'data':data}.toString()),
          (err: CaptureError) => console.error(err)
  );
    }
  }
}
