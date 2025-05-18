

export type SubscribeCallback<T> = (position: T) => void;
export type Unsubscribe = () => void;
export type Subscribe<T> = (callback: SubscribeCallback<T>) => Unsubscribe;

export class EventEmitter<T> {
  private listeners: SubscribeCallback<T>[] = [];

  public subscribe = (callback: SubscribeCallback<T>): Unsubscribe => {
    this.listeners.push(callback);

    return () => {
      this.unsubscribe(callback);
    }
  }

  protected emit = (data: T) => {
    this.listeners.forEach((callback) => callback(data));
  }

  private unsubscribe = (callback: SubscribeCallback<T>) => {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }
}