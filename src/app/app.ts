import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from './core/weather';
import { Search } from './components/search/search';
import { Sidebar } from './components/sidebar/sidebar';
import { WeatherCard } from './components/weather-card/weather-card';
import { Forecast } from './components/fore-cast/fore-cast';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Search, Sidebar, WeatherCard, Forecast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private weatherService = inject(Weather);
  private cdr = inject(ChangeDetectorRef);

  currentWeather: any = null;
  forecastDays: any[] = [];
  errorMsg: string | null = null;
  cityName: string | null = null;
  cityObj: { name: string; lat: number; lon: number } | null = null;
  isFavorite = false;
  recommendations: string[] = [];
  sidebarOpen = false;
  isLoading = false;

  constructor() {
    this.weatherService.migrateStorage();
  }

  onCitySelected(city: any) {
    const displayName = `${city.name}${city.state ? ', ' + city.state : ''}${city.country ? ' (' + city.country + ')' : ''}`;
    this.fetchWeather(displayName, city.lat, city.lon);
  }

  onSidebarCitySelected(city: { name: string; lat: number; lon: number }) {
    this.fetchWeather(city.name, city.lat, city.lon);
    this.sidebarOpen = false;
  }

  toggleFavorite() {
    if (!this.cityObj) return;
    this.isFavorite = this.weatherService.toggleFavorite(this.cityObj);
  }

  private fetchWeather(displayName: string, lat: number, lon: number) {
    this.cityName = displayName;
    this.errorMsg = null;
    this.currentWeather = null;
    this.forecastDays = [];
    this.recommendations = [];
    this.isLoading = true;
    this.cdr.detectChanges();

    this.cityObj = { name: displayName, lat, lon };
    this.weatherService.addToHistory(this.cityObj);
    this.isFavorite = this.weatherService.isFavorite(displayName);

    forkJoin({
      current: this.weatherService.getCurrentWeather(lat, lon),
      forecast: this.weatherService.getForecast(lat, lon),
    }).subscribe({
      next: ({ current, forecast }) => {
        this.isLoading = false;
        this.currentWeather = current;
        this.forecastDays = this.buildDailyForecast(forecast.list);
        this.recommendations = this.buildRecommendations(
          current.weather[0].id,
          current.weather[0].icon
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.message;
        this.cdr.detectChanges();
      },
    });
  }

  // Guarda temperaturas en Kelvin — la pipe las convierte en el template
  private buildDailyForecast(list: any[]): any[] {
    if (!list) return [];
    const grouped: { [date: string]: any[] } = {};
    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    }
    return Object.keys(grouped).slice(0, 5).map(date => {
      const dayData = grouped[date];
      let maxK = -Infinity, minK = Infinity;
      for (const item of dayData) {
        if (item.main.temp_max > maxK) maxK = item.main.temp_max;
        if (item.main.temp_min < minK) minK = item.main.temp_min;
      }
      const mid = dayData[Math.floor(dayData.length / 2)];
      const dateObj = new Date(mid.dt * 1000);
      return {
        label: `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })} ${dateObj.getDate()}`,
        tempMaxK: maxK,
        tempMinK: minK,
        icon: mid.weather[0].icon,
        desc: mid.weather[0].description,
      };
    });
  }

  private buildRecommendations(weatherId: number, icon: string): string[] {
    const isDay = icon.includes('d');
    const group = Math.floor(weatherId / 100);
    switch (group) {
      case 2: return isDay ? ['Take shelter indoors', 'Avoid open areas'] : ['Stay indoors or at the hotel', 'Dine inside'];
      case 3:
      case 5: return isDay ? ['Bring an umbrella', 'Visit museums or cinemas', 'Wear waterproof clothing'] : ['Rest night indoors', 'Avoid driving'];
      case 6: return isDay ? ['Wear thermal clothing', 'Walk carefully', 'Warm drinks recommended'] : ['Keep warm', 'Have a hot meal', 'Avoid going outside'];
      case 7: return ['Low visibility', 'Drive with caution', 'Use high beams'];
      case 8: return isDay ? ['Great for outdoor activities', 'Go for a walk or visit a park'] : ['Dine on a terrace', 'Stargazing night', 'Evening stroll'];
      default: return ['Enjoy your day regardless of the weather'];
    }
  }
}