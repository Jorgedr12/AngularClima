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
    if (!this.cityObj) {
      return;
    }
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

  private buildDailyForecast(list: any[]): any[] {
    if (!list) {
      return [];
    }
    const grouped: { [date: string]: any[] } = {};
    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    }
    return Object.keys(grouped).slice(0, 5).map(date => {
      const dayData = grouped[date];
      let maxK = -Infinity, minK = Infinity;
      for (const item of dayData) {
        if (item.main.temp_max > maxK) {
          maxK = item.main.temp_max;
        }
        if (item.main.temp_min < minK) {
          minK = item.main.temp_min;
        }
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
      case 2: return isDay
        ? ['Postpone outdoor excursions', 'Visit indoor attractions', 'Keep your luggage dry']
        : ['Stay at the hotel tonight', 'Book a restaurant indoors', 'Great night to plan tomorrow\'s trips'];
      case 3:
      case 5: return isDay
        ? ['Pack a rain jacket in your bag', 'Visit local museums or galleries', 'Great day for indoor food tours']
        : ['Cozy night at a local restaurant', 'Avoid renting a scooter or bike', 'Check tomorrow\'s forecast before booking'];
      case 6: return isDay
        ? ['Pack thermal layers for sightseeing', 'Warm up at a local café', 'Great day for indoor landmarks']
        : ['Stay warm at the hotel', 'Try local hot cuisine tonight', 'Avoid late-night outdoor walks'];
      case 7: return ['Delay travel if possible', 'Drive carefully to your destination', 'Allow extra time for transfers'];
      case 8: return isDay
        ? ['Perfect day for city exploration', 'Book outdoor tours and activities', 'Great weather for travel photos']
        : ['Enjoy a rooftop dinner', 'Perfect night for a walking tour', 'Great conditions for stargazing'];
      default: return ['Check conditions before booking outdoor tours'];
    }
  }
}