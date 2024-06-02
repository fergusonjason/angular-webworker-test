import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimerMessage } from './modules/core/interfaces/timer-message.interface';
import { IdleService } from './modules/core/services/idle.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { IdleStatus } from './modules/core/types/timer-types.type';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'angular-webworker-test';

  countdown$! : Observable<number | null>;
  idleStatus$! : Observable<IdleStatus|null>;

  constructor(private idleService : IdleService) {}

  ngOnInit(): void {

    this.countdown$ = this.idleService.countdown$;
    this.idleStatus$ = this.idleService.idleStatus$;
  }

  startTimer() {
    this.idleService.startTimer(new Date(), 10000, 10000);
  }

  onClick() {
    this.idleService.stopTimer();
  }
}
