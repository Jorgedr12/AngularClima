import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Weather {
  private http = inject(HttpClient);
  private readonly API_KEY = environment.openWeatherMapApiKey;
  private readonly HISTORY_KEY = 'weather_history';
  private readonly FAVORITES_KEY = 'weather_favorites';

  private historySubject = new BehaviorSubject<any[]>(this.getHistory());
  history$ = this.historySubject.asObservable();

  private favoritesSubject = new BehaviorSubject<any[]>(this.getFavorites());
  favorites$ = this.favoritesSubject.asObservable();

  searchCity(query: string): Observable<any[]> {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.API_KEY}`;
    return this.http.get<any[]>(url).pipe(catchError((e) => this.handleError(e)));
  }

  // Devuelve Kelvin (sin units=metric) para que la pipe lo convierta
  getCurrentWeather(lat: number, lon: number): Observable<any> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&lang=es`;
    return this.http.get<any>(url).pipe(catchError((e) => this.handleError(e)));
  }

  // Devuelve Kelvin también para consistencia con la pipe
  getForecast(lat: number, lon: number): Observable<any> {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&lang=es`;
    return this.http.get<any>(url).pipe(catchError((e) => this.handleError(e)));
  }

  addToHistory(city: { name: string; lat: number; lon: number }) {
    let history = this.getHistory();
    history = history.filter(item => item.name !== city.name);
    history.unshift(city);
    history = history.slice(0, 5); // Cache de últimas 5
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    this.historySubject.next(history);
  }

  toggleFavorite(city: { name: string; lat: number; lon: number }): boolean {
    let favs = this.getFavorites();
    const index = favs.findIndex(c => c.name === city.name);
    if (index === -1) {
      favs.push(city);
    } else {
      favs.splice(index, 1);
    }
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
    this.favoritesSubject.next(favs);
    return index === -1;
  }

  isFavorite(name: string): boolean {
    return this.getFavorites().some(c => c.name === name);
  }

  migrateStorage() {
    localStorage.removeItem('weather_cache');
  }

  private getHistory(): any[] {
    try {
      const cache = localStorage.getItem(this.HISTORY_KEY);
      const parsed = cache ? JSON.parse(cache) : [];
      return parsed.filter((c: any) => c.lat != null && c.lon != null);
    } catch { return []; }
  }

  private getFavorites(): any[] {
    try {
      const cache = localStorage.getItem(this.FAVORITES_KEY);
      const parsed = cache ? JSON.parse(cache) : [];
      return parsed.filter((c: any) => c.lat != null && c.lon != null);
    } catch { return []; }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred.';
    if (!navigator.onLine) {
      errorMessage = 'You are not connected to the internet.';
    } else if (error.status === 0) {
      errorMessage = 'Could not connect to the server. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'City not found. Please verify the name and try again.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid API key. Please check your configuration.';
    } else if (error.error?.message) {
      errorMessage = `Error: ${error.error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}