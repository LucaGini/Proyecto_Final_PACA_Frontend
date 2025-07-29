import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  showHeaderFooter = true;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe((data: Data) => {
      this.showHeaderFooter = !data['hideHeaderFooter'];
    });
  }
}

// import { Component } from '@angular/core';
// import { Router, NavigationEnd } from '@angular/router';
// @Component({
//   selector: 'app-root',
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss']
// })
// export class AppComponent {
//   title = 'tp-desarrollo';
//   isHomePage: boolean = false;

//   constructor(private router: Router) {
//     this.router.events.subscribe((event) => {
//       if (event instanceof NavigationEnd) {
//         this.isHomePage = this.router.url === '/';
//       }
//     });
//   }
// }

