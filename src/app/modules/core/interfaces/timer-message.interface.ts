
export interface TimerMessage {

    startTime: number;
    idleTime: number;
    timeoutTime: number;
}

export const isTimerMessage = (input: any) : input is TimerMessage => {

    if (typeof input === "object") {
        if (input.startTime && input.idleTime && input.timeoutTime) {
            return true;
        }
    }
    return false;
}
