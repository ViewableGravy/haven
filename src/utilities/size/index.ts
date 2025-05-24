

export class Size {
  constructor(
    private _width: number,
    private _height: number
  ) {}

  public set width(width: number) {
    this._width = width;
  }

  public set height(height: number) {
    this._height = height;
  }

  public set size({ width, height }: { width?: number; height?: number }) {
    if (width !== undefined) this._width = width;
    if (height !== undefined) this._height = height;
  }

  public get width() { return this._width; }
  public get height() { return this._height; }
}