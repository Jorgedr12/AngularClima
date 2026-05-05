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
    return this.http.get<any[]>(url).pipe(catchError(this.handleError));
  }

  getCurrentWeather(lat: number, lon: number): Observable<any> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=es`;
    return this.http.get<any>(url).pipe(catchError(this.handleError));
  }

  getForecast(lat: number, lon: number): Observable<any> {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric&lang=es`;
    return this.http.get<any>(url).pipe(catchError(this.handleError));
  }

  addToHistory(city: { name: string; lat: number; lon: number }) {
    let history = this.getHistory();
    history = history.filter(item => item.name !== city.name);
    history.unshift(city);
    history = history.slice(0, 10);
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

  private getHistory(): any[] {
    const cache = localStorage.getItem(this.HISTORY_KEY);
    return cache ? JSON.parse(cache) : [];
  }

  private getFavorites(): any[] {
    const cache = localStorage.getItem(this.FAVORITES_KEY);
    return cache ? JSON.parse(cache) : [];
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido.';
    if (!navigator.onLine) {
      errorMessage = 'No tienes conexión a internet.';
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar al servidor. Intenta más tarde.';
    } else if (error.status === 404) {
      errorMessage = 'Ciudad no encontrada. Verifica el nombre e intenta de nuevo.';
    } else if (error.status === 401) {
      errorMessage = 'API key inválida. Revisa la configuración.';
    } else if (error.error?.message) {
      errorMessage = `Error: ${error.error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}