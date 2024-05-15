import { Readable, ReadableStreamer, WritableStreamer } from './stream';

declare const stdout: Readable;
declare const stdin: WritableStreamer<void>;

// Duplexにするより WritableStreamer と ReadableStreamer を別のクラスor関数にしたほうがよさそう。
// 理由: 接続先にエラーがあった際の挙動の定義が複雑化するため

// データが流れてくるたびに関数を発火
// on("chunk") と on("close") があれば多分足りる
const stdOutTo: WritableStreamer<void> = new streamInvoker({
  onData(data: Buffer) {
    console.log('data', data);
  },
  onClose() {
    console.log('close');
  },
});

// メソッドを実行してデータを流す
const stdInFrom: ReadableStreamer = new streamSender();

// stdinfromをstdinに注入
const stdinPromise = stdInFrom.into(stdin);

// stdinに入力
stdInFrom.send(Buffer.from('message'));

// stdoutから出力を受けとって
// コンソールに出力し続ける
// stdoutが閉じると終わる
const stdoutPromise = stdout.into(stdOutTo);

await stdinPromise;
await stdoutPromise;

// Buffer型でデータを扱う方法と string型でデータを扱う方法の二種類用意してほしい
// streamに流すデータは必ずBufferにして、sendや
