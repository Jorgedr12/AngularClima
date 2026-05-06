import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KelvinToCelsiusPipe } from '../../shared/pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule, KelvinToCelsiusPipe],
  templateUrl: './weather-card.html',
})
export class WeatherCard {
  @Input() weather: any = null;
  @Input() recommendations: string[] = [];
  @Input() isFavorite = false;
  @Output() favoriteToggled = new EventEmitter<void>();

  getWindKmh(speedMs: number): string {
    return (speedMs * 3.6).toFixed(1) + ' km/h';
  }

  getIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@4x.png`;
  }
}