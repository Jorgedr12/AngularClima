import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KelvinToCelsiusPipe } from '../../shared/pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, KelvinToCelsiusPipe],
  templateUrl: './fore-cast.html',
})
export class Forecast {
  @Input() days: any[] = [];

  getIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}.png`;
  }
}