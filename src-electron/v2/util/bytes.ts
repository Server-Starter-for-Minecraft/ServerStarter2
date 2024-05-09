import * as stream from 'stream';

export class Spring<T extends Iterable<any>> {
  stream: stream.Readable;

  constructor(stream: stream.Readable) {
    this.stream = stream;
  }

  pipe<U extends Iterable<any>>(pipe: Pipe<T, U>) {
    return new Spring(this.stream.pipe(pipe.stream));
  }

  tap<U>(tap: Tap<T, U>) {
    return new Promise((resolve, reject) => {
      this.stream
        .pipe(tap.stream)
        .on('close', () => resolve(tap.data))
        .on('error', reject);
    });
  }
}

export class Pipe<T extends Iterable<any>, U extends Iterable<any>> {
  stream: stream.Transform;
  constructor(stream: stream.Transform) {
    this.stream = stream;
  }
}

export abstract class Tap<T extends Iterable<any>, U> {
  stream: stream.Writable;
  constructor(stream: stream.Writable) {
    this.stream = stream;
  }
  abstract get data(): U;
}

{
  const a = await path.read().to(JSON).collect();

  const a = new MsgStream().to(stdin)

  const out = stdout.to(console).collect();
  await out;
  const b = await path.json();
}
