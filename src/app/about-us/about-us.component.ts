import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent {
  @ViewChild('misionVisionSection') misionVisionSection!: ElementRef;

  scrollToMision() {
    this.misionVisionSection?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
}
