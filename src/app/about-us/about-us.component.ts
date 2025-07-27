import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
})
export class AboutUsComponent {
  constructor(private router: Router) {}

  @ViewChild('misionVisionSection') misionVisionSection!: ElementRef;

  scrollToMision() {
    this.misionVisionSection?.nativeElement.scrollIntoView({
      behavior: 'smooth',
    });
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }
}
