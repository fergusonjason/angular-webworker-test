/// <reference lib="webworker" />

import { Subject, interval, map, takeUntil, tap } from "rxjs";

import { TimerMessage, isTimerMessage } from "../interfaces/timer-message.interface";

// this variable name should be read in the tone of Linda from Bob's Burgers
const stahp$ : Subject<void> = new Subject<void>();

addEventListener('message', ({ data }: {data: TimerMessage | null}) => {

  if (data === null) {
    console.log("Received null, attempting to stop timer");
    stahp$.next();

    return;
  }

  if (isTimerMessage(data)) {

    interval(1000)
      .pipe(
        map((value) => data.startTime + (value * 1000)),
        tap((remainingTime) => console.log(remainingTime)),
        tap((remainingTime) => postMessage(remainingTime)),
        takeUntil(stahp$)
      )
      .subscribe();
  }

  // if it's not one of those, don't do anything
}
);
