import * as net from 'net';

/** ポートが使用中か確認する */
export async function portInUse(port: number): Promise<boolean> {
  const p = new Promise<boolean>((resolve) => {
    const server = net.createServer((socket) => {
      socket.write('Echo server\r\n');
      socket.pipe(socket);
    });

    server.on('error', () => {
      resolve(true);
    });

    server.on('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port, '127.0.0.1');
  });
  return await p;
}
