import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KelvinToCelsiusPipe } from '../../shared/pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [CommonModule, KelvinToCelsiusPipe],
  templateUrl: './weather-card.html',
})
export class WeatherCard implements OnChanges {
  @Input() weather: any = null;
  @Input() todayForecast: any = null;
  @Input() recommendations: string[] = [];
  @Input() isFavorite = false;
  @Output() favoriteToggled = new EventEmitter<void>();

  bestTime: { label: string; desc: string } = { label: '', desc: '' };

  ngOnChanges() {
    if (this.weather) {
      this.bestTime = this.getBestTime(this.weather.main.temp);
    }
  }

  getWindKmh(speedMs: number): string {
    return (speedMs * 3.6).toFixed(1) + ' km/h';
  }

  getIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@4x.png`;
  }

  private getBestTime(tempK: number): { label: string; desc: string } {
    const c = Math.round(tempK - 273.15);
    if (c < 0)   return { label: 'Off-season', desc: 'Very cold — pack heavy winter gear if you must travel.' };
    if (c < 10)  return { label: 'Shoulder season', desc: 'Cool temperatures, fewer crowds. Great for budget travel.' };
    if (c < 18)  return { label: 'Good time to visit', desc: 'Mild weather — perfect for sightseeing and walking tours.' };
    if (c < 27)  return { label: 'Peak season', desc: 'Ideal temperatures for outdoor activities and city exploration.' };
    if (c < 33)  return { label: 'Warm season', desc: 'Hot days — plan outdoor trips early morning or late afternoon.' };
    return       { label: 'Very hot season', desc: 'Extreme heat — stay hydrated and avoid midday sun.' };
  }
}