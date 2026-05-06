import { Component, EventEmitter, Output, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Weather } from '../../core/weather';
import { debounceTime, filter, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit {
  @Output() citySelected = new EventEmitter<any>();

  searchControl = new FormControl('');
  results: any[] = [];
  isLoading = false;
  showDropdown = false;
  hasSearched = false;

  private weatherService = inject(Weather);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      filter(val => {
        if (!val || val.length < 3) {
          this.results = [];
          this.isLoading = false;
          this.showDropdown = false;
          this.hasSearched = false;
          this.cdr.detectChanges();
          return false;
        }
        return true;
      }),
      switchMap(val => {
        this.isLoading = true;
        this.hasSearched = false;
        this.showDropdown = true;
        this.cdr.detectChanges();
        return this.weatherService.searchCity(val as string).pipe(
          catchError(() => {
            this.isLoading = false;
            this.hasSearched = true;
            this.cdr.detectChanges();
            return of([]);
          })
        );
      })
    ).subscribe(data => {
      this.isLoading = false;
      this.hasSearched = true;
      this.results = data;
      this.showDropdown = true;
      this.cdr.detectChanges();
    });
  }

  selectCity(city: any) {
    this.showDropdown = false;
    this.hasSearched = false;
    this.results = [];
    this.searchControl.setValue(
      `${city.name}${city.state ? ', ' + city.state : ''} (${city.country})`,
      { emitEvent: false }
    );
    this.citySelected.emit(city);
    this.cdr.detectChanges();
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 200);
  }
}