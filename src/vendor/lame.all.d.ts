export interface LameMp3Encoder {
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
}

declare const lamejs: {
  Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => LameMp3Encoder;
};

export default lamejs;
