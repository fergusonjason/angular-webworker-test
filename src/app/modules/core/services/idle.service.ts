import { Injectable } from '@angular/core';
import { TimerMessage } from '../interfaces/timer-message.interface';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { IdleStatus } from '../types/timer-types.type';

@Injectable({
  providedIn: 'root'
})
export class IdleService {

  private countdown$$ : BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);

  private isIdle$$ : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isTimedOut$$ : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private idleStatus$$ : BehaviorSubject<IdleStatus | null> = new BehaviorSubject<IdleStatus | null>(null);

  private timerWorker : Worker;

  constructor() {

    this.timerWorker = new Worker(new URL("../webworkers/timer.worker", import.meta.url));
    // bridge over the webworker output to an observable
    this.timerWorker.onmessage = null;


    // need a way to flip isIdle and isTimedOUt


   }

   get countdown$() : Observable<number | null>  {
    return this.countdown$$.asObservable();
    // TODO: do we need a shareReplay()?
   }

   get isIdle$() : Observable<boolean> {
    return this.isIdle$$.asObservable();
   }

   get isTimedOut$() : Observable<boolean> {
    return this.isTimedOut$$.asObservable();
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

    this.isIdle$$.next(false);
    this.isTimedOut$$.next(false);
    this.idleStatus$$.next("ACTIVE");

    this.timerWorker.onmessage = ({data}) => {

      this.countdown$$.next(data);
      if (data > realIdleTime && this.isIdle$$.getValue() == false) {
        this.isIdle$$.next(true);
        this.idleStatus$$.next("IDLE");
        return;
      }

      if (data > realTimeoutTime && this.isTimedOut$$.getValue() == false) {
        this.isTimedOut$$.next(true);
        this.idleStatus$$.next("TIMEOUT");
        return;
      }
    };

    this.timerWorker.postMessage(timerMessage);

  }

  stopTimer() : void {

    this.timerWorker.postMessage(null);
  }
}
