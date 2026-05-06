import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from '../../core/weather';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  @Input() isOpen = false;
  @Output() citySelected = new EventEmitter<{ name: string; lat: number; lon: number }>();
  @Output() closed = new EventEmitter<void>();

  private weatherService = inject(Weather);
  favorites$ = this.weatherService.favorites$;
  history$ = this.weatherService.history$;

  selectCity(city: { name: string; lat: number; lon: number }) {
    this.citySelected.emit(city);
    this.closed.emit();
  }
}