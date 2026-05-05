import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Weather } from '../../core/weather';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  @Output() citySelected = new EventEmitter<any>();
  searchControl = new FormControl('');
  results: any[] = [];
  isLoading = false;
  private weatherService = inject(Weather);

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(val => {
        if (!val || val.length < 3) {
          this.results = [];
          return false;
        }
        return true;
      }),
      switchMap(val => {
        this.isLoading = true;
        return this.weatherService.searchCity(val as string).pipe(
          catchError(() => {
            this.isLoading = false;
            return of([]);
          })
        );
      })
    ).subscribe(data => {
      this.isLoading = false;
      this.results = data;
    });
  }

  selectCity(city: any) {
    this.results = [];
    this.searchControl.setValue(city.name, { emitEvent: false });
    this.citySelected.emit(city);
  }
}