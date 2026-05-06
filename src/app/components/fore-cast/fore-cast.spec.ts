import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForeCast } from './fore-cast';

describe('ForeCast', () => {
  let component: ForeCast;
  let fixture: ComponentFixture<ForeCast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForeCast],
    }).compileComponents();

    fixture = TestBed.createComponent(ForeCast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
