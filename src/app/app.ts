import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from './core/weather';
import { Search } from './components/search/search';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Search],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private weatherService = inject(Weather);

  currentWeather: any = null;
  forecastDays: any[] = [];
  history$ = this.weatherService.history$;
  favorites$ = this.weatherService.favorites$;

  errorMsg: string | null = null;
  cityName: string | null = null;
  cityObj: { name: string; lat: number; lon: number } | null = null;
  isFavorite = false;
  recommendations: string[] = [];
  sidebarOpen = false;

  ngOnInit() {}

  onCitySelected(city: any) {
    const displayName = `${city.name}${city.state ? ', ' + city.state : ''}${city.country ? ' (' + city.country + ')' : ''}`;
    this.fetchWeather(displayName, city.lat, city.lon);
  }

  /** Llamado desde historial/favoritos (city.name ya está formateado) */
  loadCity(city: { name: string; lat: number; lon: number }) {
    this.fetchWeather(city.name, city.lat, city.lon);
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }
  }

  private fetchWeather(displayName: string, lat: number, lon: number) {
    this.cityName = displayName;
    this.errorMsg = null;
    this.currentWeather = null;
    this.forecastDays = [];
    this.recommendations = [];

    this.cityObj = { name: displayName, lat, lon };
    this.weatherService.addToHistory(this.cityObj);
    this.isFavorite = this.weatherService.isFavorite(displayName);

    forkJoin({
      current: this.weatherService.getCurrentWeather(lat, lon),
      forecast: this.weatherService.getForecast(lat, lon),
    }).subscribe({
      next: ({ current, forecast }) => {
        this.currentWeather = current;
        this.forecastDays = this.buildDailyForecast(forecast.list);
        this.recommendations = this.buildRecommendations(
          current.weather[0].id,
          current.weather[0].icon
        );
      },
      error: (err) => {
        this.errorMsg = err.message;
      },
    });
  }

  toggleFavorite() {
    if (!this.cityObj) return;
    this.isFavorite = this.weatherService.toggleFavorite(this.cityObj);
  }

  getWindKmh(speedMs: number): string {
    return (speedMs * 3.6).toFixed(1) + ' km/h';
  }

  getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@4x.png`;
  }

  getForecastIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}.png`;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  private buildDailyForecast(list: any[]): any[] {
    if (!list) return [];

    const grouped: { [date: string]: any[] } = {};
    for (const item of list) {
      const date = item.dt_txt.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    }

    const dates = Object.keys(grouped).slice(0, 5);

    return dates.map(date => {
      const dayData = grouped[date];
      let max = -Infinity, min = Infinity;
      for (const item of dayData) {
        if (item.main.temp_max > max) max = item.main.temp_max;
        if (item.main.temp_min < min) min = item.main.temp_min;
      }
      const mid = dayData[Math.floor(dayData.length / 2)];
      const dateObj = new Date(mid.dt * 1000);
      const dayLabel = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayNum = dateObj.getDate();
      return {
        label: `${dayLabel} ${dayNum}`,
        tempMax: Math.round(max),
        tempMin: Math.round(min),
        icon: mid.weather[0].icon,
        desc: mid.weather[0].description,
      };
    });
  }

  private buildRecommendations(climaId: number, icon: string): string[] {
    const esDeDia = icon.includes('d');
    const grupo = Math.floor(climaId / 100);

    switch (grupo) {
      case 2:
        return esDeDia
          ? ['Refúgiate en interiores', 'Evita áreas abiertas']
          : ['Quédate en casa/hotel', 'Cena en el interior'];
      case 3:
      case 5:
        return esDeDia
          ? ['Usa paraguas', 'Museos o cines', 'Ropa impermeable']
          : ['Noche de descanso', 'Evita conducir'];
      case 6:
        return esDeDia
          ? ['Ropa térmica', 'Paseo con cuidado', 'Bebidas calientes']
          : ['Mantente abrigado', 'Cena caliente', 'Evita el exterior'];
      case 7:
        return ['Baja visibilidad', 'Conduce con precaución', 'Usa luces altas'];
      case 8:
        return esDeDia
          ? ['Actividades al aire libre', 'Caminata o parque']
          : ['Cena en terraza', 'Observar estrellas', 'Paseo nocturno'];
      default:
        return ['Disfruta el día sin importar el clima'];
    }
  }
}