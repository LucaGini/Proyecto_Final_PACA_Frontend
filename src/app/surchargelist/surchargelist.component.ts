import { Component} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CityService } from '../services/city.service';

@Component({
  selector: 'app-surchargelist',
  templateUrl: './surchargelist.component.html',
  styleUrls: ['./surchargelist.component.scss']
})
export class SurchargelistComponent {
  cities: any[] = [];
  selectedCityId: string | null = null; // Para el ID seleccionado
  selectedCity: any | undefined; 

  constructor(
    private route: ActivatedRoute,
    private cityService: CityService
  ) { }

  ngOnInit() {
    this.getCities();
  }
  getCities() {
    this.cityService.findAll()
    .subscribe(
      (data: any) => {
        this.cities = data.data;
      },
      (error) => {
        console.error('Error fetching cities', error);
      }
    );
  }
  
  onCityChange(event: any) {
    const cityId = event.target.value;
    this.selectedCity = this.cities.find((city) => city.id === cityId);
    if (this.selectedCity) {
      console.log('Ciudad seleccionada:', this.selectedCity);
    } else {
      console.error('No se encontró la ciudad seleccionada');
    }
  }
}
