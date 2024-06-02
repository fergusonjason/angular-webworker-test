import { Injectable } from '@angular/core';
import { TimerMessage } from '../interfaces/timer-message.interface';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { IdleStatus } from '../types/timer-types.type';

@Injectable({
  providedIn: 'root'
})
export class IdleService {

  private timer$$ : BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);
  private countdownToTimeout$$ : BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);

  private idleStatus$$ : BehaviorSubject<IdleStatus | null> = new BehaviorSubject<IdleStatus | null>(null);

  private timerWorker : Worker;

  constructor() {

    this.timerWorker = new Worker(new URL("../webworkers/timer.worker", import.meta.url));

    // the event handler will be set up on the fly
    this.timerWorker.onmessage = null;


   }

   get timer$() : Observable<number | null>  {
    return this.timer$$.asObservable();
    // TODO: do we need a shareReplay()?
   }

   get countdownToTimeout$() : Observable<number | null> {
    return this.countdownToTimeout$$.asObservable();
   }

   // should I just base these on the idle status?
   get isActive$() : Observable<boolean> {
    return this.idleStatus$$.pipe(
      map((status) => {
        if (!status) {
          return true;
        }

        switch (status) {
          case "ACTIVE":
            return true;
          default:
            return false;
        }
      })
    );
   }

   get isIdle$() : Observable<boolean> {

    return this.idleStatus$$.pipe(
      map((status) => {
        if (!status) {
          return true;
        }

        switch (status) {
          case "IDLE":
            return true;
          default:
            return false;
        }
      })
    );
   }

   get isTimedOut$() : Observable<boolean> {
    return this.idleStatus$$.pipe(
      map((status) => {
        if (!status) {
          return true;
        }

        switch (status) {
          case "TIMEOUT":
            return true;
          default:
            return false;
        }
      })
    );
   }

   get idleStatus$() : Observable<IdleStatus | null> {
    return this.idleStatus$$.asObservable();
   }

  startTimer(start: Date, timeToIdleMs: number, timeToTimeoutMs: number) : void {

    // yes, it truncates the milliseconds. If you don't like it, don't use it
    const realStartTime : number = start.setMilliseconds(0);
    const realIdleTime : number = realStartTime + timeToIdleMs;
    const realTimeoutTime : number = realStartTime + timeToIdleMs + timeToTimeoutMs;

    // all values are unix epoch timestamps
    const timerMessage: TimerMessage = {
      startTime: realStartTime,
      idleTime: realIdleTime,
      timeoutTime: realTimeoutTime
    };

    this.idleStatus$$.next("ACTIVE");

    this.timerWorker.onmessage = ({data}) => {

      this.timer$$.next(data);
      if (data > realIdleTime && this.idleStatus$$.getValue() !== "IDLE") {
        this.idleStatus$$.next("IDLE");
      }

      if (data > realTimeoutTime && this.idleStatus$$.getValue() !== "TIMEOUT") {
        this.idleStatus$$.next("TIMEOUT");
      }

      let timeUntilTimeout = realTimeoutTime - data;
      timeUntilTimeout = timeUntilTimeout > 0 ? timeUntilTimeout : 0;
      this.countdownToTimeout$$.next(timeUntilTimeout);
    };

    this.timerWorker.postMessage(timerMessage);

  }

  stopTimer() : void {

    this.timerWorker.postMessage(null);
  }
}
