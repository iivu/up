export function success(msg: any) {
  console.log('\x1b[32m[SUCCESS] - %s\x1b[0m', msg);
}

export function error(msg: any) {
  console.log('\x1b[31m[ERROR] - %s\x1b[0m', msg);
}

export function info(msg: any) {
  console.log('\x1b[37m[INFO] - %s\x1b[0m', msg);
}

export function warn(msg: any) {
  console.log('\x1b[33m[WARN] - %s\x1b[0m', msg);
}
