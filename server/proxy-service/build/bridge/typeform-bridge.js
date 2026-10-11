(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/lib0/map.js
  var create = () => /* @__PURE__ */ new Map();
  var copy = (m) => {
    const r = create();
    m.forEach((v, k) => {
      r.set(k, v);
    });
    return r;
  };
  var setIfUndefined = (map2, key, createT) => {
    let set = map2.get(key);
    if (set === void 0) {
      map2.set(key, set = createT());
    }
    return set;
  };
  var map = (m, f) => {
    const res = [];
    for (const [key, value] of m) {
      res.push(f(value, key));
    }
    return res;
  };
  var any = (m, f) => {
    for (const [key, value] of m) {
      if (f(value, key)) {
        return true;
      }
    }
    return false;
  };

  // node_modules/lib0/set.js
  var create2 = () => /* @__PURE__ */ new Set();

  // node_modules/lib0/array.js
  var last = (arr) => arr[arr.length - 1];
  var appendTo = (dest, src) => {
    for (let i = 0; i < src.length; i++) {
      dest.push(src[i]);
    }
  };
  var from = Array.from;
  var every = (arr, f) => {
    for (let i = 0; i < arr.length; i++) {
      if (!f(arr[i], i, arr)) {
        return false;
      }
    }
    return true;
  };
  var some = (arr, f) => {
    for (let i = 0; i < arr.length; i++) {
      if (f(arr[i], i, arr)) {
        return true;
      }
    }
    return false;
  };
  var unfold = (len, f) => {
    const array = new Array(len);
    for (let i = 0; i < len; i++) {
      array[i] = f(i, array);
    }
    return array;
  };
  var isArray = Array.isArray;

  // node_modules/lib0/observable.js
  var ObservableV2 = class {
    constructor() {
      this._observers = create();
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    on(name, f) {
      setIfUndefined(
        this._observers,
        /** @type {string} */
        name,
        create2
      ).add(f);
      return f;
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    once(name, f) {
      const _f = (...args2) => {
        this.off(
          name,
          /** @type {any} */
          _f
        );
        f(...args2);
      };
      this.on(
        name,
        /** @type {any} */
        _f
      );
    }
    /**
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name
     * @param {EVENTS[NAME]} f
     */
    off(name, f) {
      const observers = this._observers.get(name);
      if (observers !== void 0) {
        observers.delete(f);
        if (observers.size === 0) {
          this._observers.delete(name);
        }
      }
    }
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     *
     * @todo This should catch exceptions
     *
     * @template {keyof EVENTS & string} NAME
     * @param {NAME} name The event name.
     * @param {Parameters<EVENTS[NAME]>} args The arguments that are applied to the event listener.
     */
    emit(name, args2) {
      return from((this._observers.get(name) || create()).values()).forEach((f) => f(...args2));
    }
    destroy() {
      this._observers = create();
    }
  };

  // node_modules/lib0/math.js
  var floor = Math.floor;
  var abs = Math.abs;
  var min = (a, b) => a < b ? a : b;
  var max = (a, b) => a > b ? a : b;
  var isNaN = Number.isNaN;
  var isNegativeZero = (n) => n !== 0 ? n < 0 : 1 / n < 0;

  // node_modules/lib0/binary.js
  var BIT1 = 1;
  var BIT2 = 2;
  var BIT3 = 4;
  var BIT4 = 8;
  var BIT6 = 32;
  var BIT7 = 64;
  var BIT8 = 128;
  var BIT18 = 1 << 17;
  var BIT19 = 1 << 18;
  var BIT20 = 1 << 19;
  var BIT21 = 1 << 20;
  var BIT22 = 1 << 21;
  var BIT23 = 1 << 22;
  var BIT24 = 1 << 23;
  var BIT25 = 1 << 24;
  var BIT26 = 1 << 25;
  var BIT27 = 1 << 26;
  var BIT28 = 1 << 27;
  var BIT29 = 1 << 28;
  var BIT30 = 1 << 29;
  var BIT31 = 1 << 30;
  var BIT32 = 1 << 31;
  var BITS5 = 31;
  var BITS6 = 63;
  var BITS7 = 127;
  var BITS17 = BIT18 - 1;
  var BITS18 = BIT19 - 1;
  var BITS19 = BIT20 - 1;
  var BITS20 = BIT21 - 1;
  var BITS21 = BIT22 - 1;
  var BITS22 = BIT23 - 1;
  var BITS23 = BIT24 - 1;
  var BITS24 = BIT25 - 1;
  var BITS25 = BIT26 - 1;
  var BITS26 = BIT27 - 1;
  var BITS27 = BIT28 - 1;
  var BITS28 = BIT29 - 1;
  var BITS29 = BIT30 - 1;
  var BITS30 = BIT31 - 1;
  var BITS31 = 2147483647;

  // node_modules/lib0/number.js
  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
  var LOWEST_INT32 = 1 << 31;
  var isInteger = Number.isInteger || ((num) => typeof num === "number" && isFinite(num) && floor(num) === num);
  var isNaN2 = Number.isNaN;
  var parseInt = Number.parseInt;

  // node_modules/lib0/string.js
  var fromCharCode = String.fromCharCode;
  var fromCodePoint = String.fromCodePoint;
  var MAX_UTF16_CHARACTER = fromCharCode(65535);
  var toLowerCase = (s) => s.toLowerCase();
  var trimLeftRegex = /^\s*/g;
  var trimLeft = (s) => s.replace(trimLeftRegex, "");
  var fromCamelCaseRegex = /([A-Z])/g;
  var fromCamelCase = (s, separator) => trimLeft(s.replace(fromCamelCaseRegex, (match2) => `${separator}${toLowerCase(match2)}`));
  var _encodeUtf8Polyfill = (str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = /** @type {number} */
      encodedString.codePointAt(i);
    }
    return buf;
  };
  var utf8TextEncoder = (
    /** @type {TextEncoder} */
    typeof TextEncoder !== "undefined" ? new TextEncoder() : null
  );
  var _encodeUtf8Native = (str) => utf8TextEncoder.encode(str);
  var encodeUtf8 = utf8TextEncoder ? _encodeUtf8Native : _encodeUtf8Polyfill;
  var utf8TextDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  if (utf8TextDecoder && utf8TextDecoder.decode(new Uint8Array()).length === 1) {
    utf8TextDecoder = null;
  }
  var repeat = (source, n) => unfold(n, () => source).join("");

  // node_modules/lib0/encoding.js
  var Encoder = class {
    constructor() {
      this.cpos = 0;
      this.cbuf = new Uint8Array(100);
      this.bufs = [];
    }
  };
  var createEncoder = () => new Encoder();
  var length = (encoder) => {
    let len = encoder.cpos;
    for (let i = 0; i < encoder.bufs.length; i++) {
      len += encoder.bufs[i].length;
    }
    return len;
  };
  var toUint8Array = (encoder) => {
    const uint8arr = new Uint8Array(length(encoder));
    let curPos = 0;
    for (let i = 0; i < encoder.bufs.length; i++) {
      const d = encoder.bufs[i];
      uint8arr.set(d, curPos);
      curPos += d.length;
    }
    uint8arr.set(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
    return uint8arr;
  };
  var verifyLen = (encoder, len) => {
    const bufferLen = encoder.cbuf.length;
    if (bufferLen - encoder.cpos < len) {
      encoder.bufs.push(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos));
      encoder.cbuf = new Uint8Array(max(bufferLen, len) * 2);
      encoder.cpos = 0;
    }
  };
  var write = (encoder, num) => {
    const bufferLen = encoder.cbuf.length;
    if (encoder.cpos === bufferLen) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(bufferLen * 2);
      encoder.cpos = 0;
    }
    encoder.cbuf[encoder.cpos++] = num;
  };
  var writeUint8 = write;
  var writeVarUint = (encoder, num) => {
    while (num > BITS7) {
      write(encoder, BIT8 | BITS7 & num);
      num = floor(num / 128);
    }
    write(encoder, BITS7 & num);
  };
  var writeVarInt = (encoder, num) => {
    const isNegative = isNegativeZero(num);
    if (isNegative) {
      num = -num;
    }
    write(encoder, (num > BITS6 ? BIT8 : 0) | (isNegative ? BIT7 : 0) | BITS6 & num);
    num = floor(num / 64);
    while (num > 0) {
      write(encoder, (num > BITS7 ? BIT8 : 0) | BITS7 & num);
      num = floor(num / 128);
    }
  };
  var _strBuffer = new Uint8Array(3e4);
  var _maxStrBSize = _strBuffer.length / 3;
  var _writeVarStringNative = (encoder, str) => {
    if (str.length < _maxStrBSize) {
      const written = utf8TextEncoder.encodeInto(str, _strBuffer).written || 0;
      writeVarUint(encoder, written);
      for (let i = 0; i < written; i++) {
        write(encoder, _strBuffer[i]);
      }
    } else {
      writeVarUint8Array(encoder, encodeUtf8(str));
    }
  };
  var _writeVarStringPolyfill = (encoder, str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    writeVarUint(encoder, len);
    for (let i = 0; i < len; i++) {
      write(
        encoder,
        /** @type {number} */
        encodedString.codePointAt(i)
      );
    }
  };
  var writeVarString = utf8TextEncoder && /** @type {any} */
  utf8TextEncoder.encodeInto ? _writeVarStringNative : _writeVarStringPolyfill;
  var writeUint8Array = (encoder, uint8Array) => {
    const bufferLen = encoder.cbuf.length;
    const cpos = encoder.cpos;
    const leftCopyLen = min(bufferLen - cpos, uint8Array.length);
    const rightCopyLen = uint8Array.length - leftCopyLen;
    encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
    encoder.cpos += leftCopyLen;
    if (rightCopyLen > 0) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(max(bufferLen * 2, rightCopyLen));
      encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
      encoder.cpos = rightCopyLen;
    }
  };
  var writeVarUint8Array = (encoder, uint8Array) => {
    writeVarUint(encoder, uint8Array.byteLength);
    writeUint8Array(encoder, uint8Array);
  };
  var writeOnDataView = (encoder, len) => {
    verifyLen(encoder, len);
    const dview = new DataView(encoder.cbuf.buffer, encoder.cpos, len);
    encoder.cpos += len;
    return dview;
  };
  var writeFloat32 = (encoder, num) => writeOnDataView(encoder, 4).setFloat32(0, num, false);
  var writeFloat64 = (encoder, num) => writeOnDataView(encoder, 8).setFloat64(0, num, false);
  var writeBigInt64 = (encoder, num) => (
    /** @type {any} */
    writeOnDataView(encoder, 8).setBigInt64(0, num, false)
  );
  var floatTestBed = new DataView(new ArrayBuffer(4));
  var isFloat32 = (num) => {
    floatTestBed.setFloat32(0, num);
    return floatTestBed.getFloat32(0) === num;
  };
  var writeAny = (encoder, data) => {
    switch (typeof data) {
      case "string":
        write(encoder, 119);
        writeVarString(encoder, data);
        break;
      case "number":
        if (isInteger(data) && abs(data) <= BITS31) {
          write(encoder, 125);
          writeVarInt(encoder, data);
        } else if (isFloat32(data)) {
          write(encoder, 124);
          writeFloat32(encoder, data);
        } else {
          write(encoder, 123);
          writeFloat64(encoder, data);
        }
        break;
      case "bigint":
        write(encoder, 122);
        writeBigInt64(encoder, data);
        break;
      case "object":
        if (data === null) {
          write(encoder, 126);
        } else if (isArray(data)) {
          write(encoder, 117);
          writeVarUint(encoder, data.length);
          for (let i = 0; i < data.length; i++) {
            writeAny(encoder, data[i]);
          }
        } else if (data instanceof Uint8Array) {
          write(encoder, 116);
          writeVarUint8Array(encoder, data);
        } else {
          write(encoder, 118);
          const keys3 = Object.keys(data);
          writeVarUint(encoder, keys3.length);
          for (let i = 0; i < keys3.length; i++) {
            const key = keys3[i];
            writeVarString(encoder, key);
            writeAny(encoder, data[key]);
          }
        }
        break;
      case "boolean":
        write(encoder, data ? 120 : 121);
        break;
      default:
        write(encoder, 127);
    }
  };
  var RleEncoder = class extends Encoder {
    /**
     * @param {function(Encoder, T):void} writer
     */
    constructor(writer) {
      super();
      this.w = writer;
      this.s = null;
      this.count = 0;
    }
    /**
     * @param {T} v
     */
    write(v) {
      if (this.s === v) {
        this.count++;
      } else {
        if (this.count > 0) {
          writeVarUint(this, this.count - 1);
        }
        this.count = 1;
        this.w(this, v);
        this.s = v;
      }
    }
  };
  var flushUintOptRleEncoder = (encoder) => {
    if (encoder.count > 0) {
      writeVarInt(encoder.encoder, encoder.count === 1 ? encoder.s : -encoder.s);
      if (encoder.count > 1) {
        writeVarUint(encoder.encoder, encoder.count - 2);
      }
    }
  };
  var UintOptRleEncoder = class {
    constructor() {
      this.encoder = new Encoder();
      this.s = 0;
      this.count = 0;
    }
    /**
     * @param {number} v
     */
    write(v) {
      if (this.s === v) {
        this.count++;
      } else {
        flushUintOptRleEncoder(this);
        this.count = 1;
        this.s = v;
      }
    }
    /**
     * Flush the encoded state and transform this to a Uint8Array.
     *
     * Note that this should only be called once.
     */
    toUint8Array() {
      flushUintOptRleEncoder(this);
      return toUint8Array(this.encoder);
    }
  };
  var flushIntDiffOptRleEncoder = (encoder) => {
    if (encoder.count > 0) {
      const encodedDiff = encoder.diff * 2 + (encoder.count === 1 ? 0 : 1);
      writeVarInt(encoder.encoder, encodedDiff);
      if (encoder.count > 1) {
        writeVarUint(encoder.encoder, encoder.count - 2);
      }
    }
  };
  var IntDiffOptRleEncoder = class {
    constructor() {
      this.encoder = new Encoder();
      this.s = 0;
      this.count = 0;
      this.diff = 0;
    }
    /**
     * @param {number} v
     */
    write(v) {
      if (this.diff === v - this.s) {
        this.s = v;
        this.count++;
      } else {
        flushIntDiffOptRleEncoder(this);
        this.count = 1;
        this.diff = v - this.s;
        this.s = v;
      }
    }
    /**
     * Flush the encoded state and transform this to a Uint8Array.
     *
     * Note that this should only be called once.
     */
    toUint8Array() {
      flushIntDiffOptRleEncoder(this);
      return toUint8Array(this.encoder);
    }
  };
  var StringEncoder = class {
    constructor() {
      this.sarr = [];
      this.s = "";
      this.lensE = new UintOptRleEncoder();
    }
    /**
     * @param {string} string
     */
    write(string) {
      this.s += string;
      if (this.s.length > 19) {
        this.sarr.push(this.s);
        this.s = "";
      }
      this.lensE.write(string.length);
    }
    toUint8Array() {
      const encoder = new Encoder();
      this.sarr.push(this.s);
      this.s = "";
      writeVarString(encoder, this.sarr.join(""));
      writeUint8Array(encoder, this.lensE.toUint8Array());
      return toUint8Array(encoder);
    }
  };

  // node_modules/lib0/error.js
  var create3 = (s) => new Error(s);
  var methodUnimplemented = () => {
    throw create3("Method unimplemented");
  };
  var unexpectedCase = () => {
    throw create3("Unexpected case");
  };

  // node_modules/lib0/decoding.js
  var errorUnexpectedEndOfArray = create3("Unexpected end of array");
  var errorIntegerOutOfRange = create3("Integer out of Range");
  var Decoder = class {
    /**
     * @param {Uint8Array<Buf>} uint8Array Binary data to decode
     */
    constructor(uint8Array) {
      this.arr = uint8Array;
      this.pos = 0;
    }
  };
  var createDecoder = (uint8Array) => new Decoder(uint8Array);
  var hasContent = (decoder) => decoder.pos !== decoder.arr.length;
  var readUint8Array = (decoder, len) => {
    const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
    decoder.pos += len;
    return view;
  };
  var readVarUint8Array = (decoder) => readUint8Array(decoder, readVarUint(decoder));
  var readUint8 = (decoder) => decoder.arr[decoder.pos++];
  var readVarUint = (decoder) => {
    let num = 0;
    let mult = 1;
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      const r = decoder.arr[decoder.pos++];
      num = num + (r & BITS7) * mult;
      mult *= 128;
      if (r < BIT8) {
        return num;
      }
      if (num > MAX_SAFE_INTEGER) {
        throw errorIntegerOutOfRange;
      }
    }
    throw errorUnexpectedEndOfArray;
  };
  var readVarInt = (decoder) => {
    let r = decoder.arr[decoder.pos++];
    let num = r & BITS6;
    let mult = 64;
    const sign = (r & BIT7) > 0 ? -1 : 1;
    if ((r & BIT8) === 0) {
      return sign * num;
    }
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      r = decoder.arr[decoder.pos++];
      num = num + (r & BITS7) * mult;
      mult *= 128;
      if (r < BIT8) {
        return sign * num;
      }
      if (num > MAX_SAFE_INTEGER) {
        throw errorIntegerOutOfRange;
      }
    }
    throw errorUnexpectedEndOfArray;
  };
  var _readVarStringPolyfill = (decoder) => {
    let remainingLen = readVarUint(decoder);
    if (remainingLen === 0) {
      return "";
    } else {
      let encodedString = String.fromCodePoint(readUint8(decoder));
      if (--remainingLen < 100) {
        while (remainingLen--) {
          encodedString += String.fromCodePoint(readUint8(decoder));
        }
      } else {
        while (remainingLen > 0) {
          const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
          const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
          decoder.pos += nextLen;
          encodedString += String.fromCodePoint.apply(
            null,
            /** @type {any} */
            bytes
          );
          remainingLen -= nextLen;
        }
      }
      return decodeURIComponent(escape(encodedString));
    }
  };
  var _readVarStringNative = (decoder) => (
    /** @type any */
    utf8TextDecoder.decode(readVarUint8Array(decoder))
  );
  var readVarString = utf8TextDecoder ? _readVarStringNative : _readVarStringPolyfill;
  var readFromDataView = (decoder, len) => {
    const dv = new DataView(decoder.arr.buffer, decoder.arr.byteOffset + decoder.pos, len);
    decoder.pos += len;
    return dv;
  };
  var readFloat32 = (decoder) => readFromDataView(decoder, 4).getFloat32(0, false);
  var readFloat64 = (decoder) => readFromDataView(decoder, 8).getFloat64(0, false);
  var readBigInt64 = (decoder) => (
    /** @type {any} */
    readFromDataView(decoder, 8).getBigInt64(0, false)
  );
  var readAnyLookupTable = [
    (decoder) => void 0,
    // CASE 127: undefined
    (decoder) => null,
    // CASE 126: null
    readVarInt,
    // CASE 125: integer
    readFloat32,
    // CASE 124: float32
    readFloat64,
    // CASE 123: float64
    readBigInt64,
    // CASE 122: bigint
    (decoder) => false,
    // CASE 121: boolean (false)
    (decoder) => true,
    // CASE 120: boolean (true)
    readVarString,
    // CASE 119: string
    (decoder) => {
      const len = readVarUint(decoder);
      const obj = {};
      for (let i = 0; i < len; i++) {
        const key = readVarString(decoder);
        obj[key] = readAny(decoder);
      }
      return obj;
    },
    (decoder) => {
      const len = readVarUint(decoder);
      const arr = [];
      for (let i = 0; i < len; i++) {
        arr.push(readAny(decoder));
      }
      return arr;
    },
    readVarUint8Array
    // CASE 116: Uint8Array
  ];
  var readAny = (decoder) => readAnyLookupTable[127 - readUint8(decoder)](decoder);
  var RleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     * @param {function(Decoder):T} reader
     */
    constructor(uint8Array, reader) {
      super(uint8Array);
      this.reader = reader;
      this.s = null;
      this.count = 0;
    }
    read() {
      if (this.count === 0) {
        this.s = this.reader(this);
        if (hasContent(this)) {
          this.count = readVarUint(this) + 1;
        } else {
          this.count = -1;
        }
      }
      this.count--;
      return (
        /** @type {T} */
        this.s
      );
    }
  };
  var UintOptRleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      super(uint8Array);
      this.s = 0;
      this.count = 0;
    }
    read() {
      if (this.count === 0) {
        this.s = readVarInt(this);
        const isNegative = isNegativeZero(this.s);
        this.count = 1;
        if (isNegative) {
          this.s = -this.s;
          this.count = readVarUint(this) + 2;
        }
      }
      this.count--;
      return (
        /** @type {number} */
        this.s
      );
    }
  };
  var IntDiffOptRleDecoder = class extends Decoder {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      super(uint8Array);
      this.s = 0;
      this.count = 0;
      this.diff = 0;
    }
    /**
     * @return {number}
     */
    read() {
      if (this.count === 0) {
        const diff = readVarInt(this);
        const hasCount = diff & 1;
        this.diff = floor(diff / 2);
        this.count = 1;
        if (hasCount) {
          this.count = readVarUint(this) + 2;
        }
      }
      this.s += this.diff;
      this.count--;
      return this.s;
    }
  };
  var StringDecoder = class {
    /**
     * @param {Uint8Array} uint8Array
     */
    constructor(uint8Array) {
      this.decoder = new UintOptRleDecoder(uint8Array);
      this.str = readVarString(this.decoder);
      this.spos = 0;
    }
    /**
     * @return {string}
     */
    read() {
      const end = this.spos + this.decoder.read();
      const res = this.str.slice(this.spos, end);
      this.spos = end;
      return res;
    }
  };

  // node_modules/lib0/webcrypto.js
  var subtle = crypto.subtle;
  var getRandomValues = crypto.getRandomValues.bind(crypto);

  // node_modules/lib0/random.js
  var uint32 = () => getRandomValues(new Uint32Array(1))[0];
  var uuidv4Template = "10000000-1000-4000-8000" + -1e11;
  var uuidv4 = () => uuidv4Template.replace(
    /[018]/g,
    /** @param {number} c */
    (c) => (c ^ uint32() & 15 >> c / 4).toString(16)
  );

  // node_modules/lib0/time.js
  var getUnixTime = Date.now;

  // node_modules/lib0/promise.js
  var create4 = (f) => (
    /** @type {Promise<T>} */
    new Promise(f)
  );
  var all = Promise.all.bind(Promise);

  // node_modules/lib0/conditions.js
  var undefinedToNull = (v) => v === void 0 ? null : v;

  // node_modules/lib0/storage.js
  var VarStoragePolyfill = class {
    constructor() {
      this.map = /* @__PURE__ */ new Map();
    }
    /**
     * @param {string} key
     * @param {any} newValue
     */
    setItem(key, newValue) {
      this.map.set(key, newValue);
    }
    /**
     * @param {string} key
     */
    getItem(key) {
      return this.map.get(key);
    }
  };
  var _localStorage = new VarStoragePolyfill();
  var usePolyfill = true;
  try {
    if (typeof localStorage !== "undefined" && localStorage) {
      _localStorage = localStorage;
      usePolyfill = false;
    }
  } catch (e) {
  }
  var varStorage = _localStorage;

  // node_modules/lib0/trait/equality.js
  var EqualityTraitSymbol = Symbol("Equality");
  var equals = (a, b) => a === b || !!a?.[EqualityTraitSymbol]?.(b) || false;

  // node_modules/lib0/object.js
  var isObject = (o) => typeof o === "object";
  var assign = Object.assign;
  var keys = Object.keys;
  var forEach = (obj, f) => {
    for (const key in obj) {
      f(obj[key], key);
    }
  };
  var size = (obj) => keys(obj).length;
  var isEmpty = (obj) => {
    for (const _k in obj) {
      return false;
    }
    return true;
  };
  var every2 = (obj, f) => {
    for (const key in obj) {
      if (!f(obj[key], key)) {
        return false;
      }
    }
    return true;
  };
  var hasProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  var equalFlat = (a, b) => a === b || size(a) === size(b) && every2(a, (val, key) => (val !== void 0 || hasProperty(b, key)) && equals(b[key], val));
  var freeze = Object.freeze;
  var deepFreeze = (o) => {
    for (const key in o) {
      const c = o[key];
      if (typeof c === "object" || typeof c === "function") {
        deepFreeze(o[key]);
      }
    }
    return freeze(o);
  };

  // node_modules/lib0/function.js
  var callAll = (fs, args2, i = 0) => {
    try {
      for (; i < fs.length; i++) {
        fs[i](...args2);
      }
    } finally {
      if (i < fs.length) {
        callAll(fs, args2, i + 1);
      }
    }
  };
  var id = (a) => a;
  var equalityDeep = (a, b) => {
    if (a === b) {
      return true;
    }
    if (a == null || b == null || a.constructor !== b.constructor && (a.constructor || Object) !== (b.constructor || Object)) {
      return false;
    }
    if (a[EqualityTraitSymbol] != null) {
      return a[EqualityTraitSymbol](b);
    }
    switch (a.constructor) {
      case ArrayBuffer:
        a = new Uint8Array(a);
        b = new Uint8Array(b);
      // eslint-disable-next-line no-fallthrough
      case Uint8Array: {
        if (a.byteLength !== b.byteLength) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        break;
      }
      case Set: {
        if (a.size !== b.size) {
          return false;
        }
        for (const value of a) {
          if (!b.has(value)) {
            return false;
          }
        }
        break;
      }
      case Map: {
        if (a.size !== b.size) {
          return false;
        }
        for (const key of a.keys()) {
          if (!b.has(key) || !equalityDeep(a.get(key), b.get(key))) {
            return false;
          }
        }
        break;
      }
      case void 0:
      case Object:
        if (size(a) !== size(b)) {
          return false;
        }
        for (const key in a) {
          if (!hasProperty(a, key) || !equalityDeep(a[key], b[key])) {
            return false;
          }
        }
        break;
      case Array:
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!equalityDeep(a[i], b[i])) {
            return false;
          }
        }
        break;
      default:
        return false;
    }
    return true;
  };
  var isOneOf = (value, options) => options.includes(value);

  // node_modules/lib0/environment.js
  var isNode = typeof process !== "undefined" && process.release && /node|io\.js/.test(process.release.name) && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
  var isMac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
  var params;
  var args = [];
  var computeParams = () => {
    if (params === void 0) {
      if (isNode) {
        params = create();
        const pargs = process.argv;
        let currParamName = null;
        for (let i = 0; i < pargs.length; i++) {
          const parg = pargs[i];
          if (parg[0] === "-") {
            if (currParamName !== null) {
              params.set(currParamName, "");
            }
            currParamName = parg;
          } else {
            if (currParamName !== null) {
              params.set(currParamName, parg);
              currParamName = null;
            } else {
              args.push(parg);
            }
          }
        }
        if (currParamName !== null) {
          params.set(currParamName, "");
        }
      } else if (typeof location === "object") {
        params = create();
        (location.search || "?").slice(1).split("&").forEach((kv) => {
          if (kv.length !== 0) {
            const [key, value] = kv.split("=");
            params.set(`--${fromCamelCase(key, "-")}`, value);
            params.set(`-${fromCamelCase(key, "-")}`, value);
          }
        });
      } else {
        params = create();
      }
    }
    return params;
  };
  var hasParam = (name) => computeParams().has(name);
  var getVariable = (name) => isNode ? undefinedToNull(process.env[name.toUpperCase().replaceAll("-", "_")]) : undefinedToNull(varStorage.getItem(name));
  var hasConf = (name) => hasParam("--" + name) || getVariable(name) !== null;
  var production = hasConf("production");
  var forceColor = isNode && isOneOf(process.env.FORCE_COLOR, ["true", "1", "2"]);
  var supportsColor = forceColor || !hasParam("--no-colors") && // @todo deprecate --no-colors
  !hasConf("no-color") && (!isNode || process.stdout.isTTY) && (!isNode || hasParam("--color") || getVariable("COLORTERM") !== null || (getVariable("TERM") || "").includes("color"));

  // node_modules/lib0/buffer.js
  var createUint8ArrayFromLen = (len) => new Uint8Array(len);
  var copyUint8Array = (uint8Array) => {
    const newBuf = createUint8ArrayFromLen(uint8Array.byteLength);
    newBuf.set(uint8Array);
    return newBuf;
  };

  // node_modules/lib0/pair.js
  var Pair = class {
    /**
     * @param {L} left
     * @param {R} right
     */
    constructor(left, right) {
      this.left = left;
      this.right = right;
    }
  };
  var create5 = (left, right) => new Pair(left, right);

  // node_modules/lib0/prng.js
  var bool = (gen) => gen.next() >= 0.5;
  var int53 = (gen, min4, max4) => floor(gen.next() * (max4 + 1 - min4) + min4);
  var int32 = (gen, min4, max4) => floor(gen.next() * (max4 + 1 - min4) + min4);
  var int31 = (gen, min4, max4) => int32(gen, min4, max4);
  var letter = (gen) => fromCharCode(int31(gen, 97, 122));
  var word = (gen, minLen = 0, maxLen = 20) => {
    const len = int31(gen, minLen, maxLen);
    let str = "";
    for (let i = 0; i < len; i++) {
      str += letter(gen);
    }
    return str;
  };
  var oneOf = (gen, array) => array[int31(gen, 0, array.length - 1)];

  // node_modules/lib0/schema.js
  var schemaSymbol = Symbol("0schema");
  var ValidationError = class {
    constructor() {
      this._rerrs = [];
    }
    /**
     * @param {string?} path
     * @param {string} expected
     * @param {string} has
     * @param {string?} message
     */
    extend(path, expected, has, message = null) {
      this._rerrs.push({ path, expected, has, message });
    }
    toString() {
      const s = [];
      for (let i = this._rerrs.length - 1; i > 0; i--) {
        const r = this._rerrs[i];
        s.push(repeat(" ", (this._rerrs.length - i) * 2) + `${r.path != null ? `[${r.path}] ` : ""}${r.has} doesn't match ${r.expected}. ${r.message}`);
      }
      return s.join("\n");
    }
  };
  var shapeExtends = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null || a.constructor !== b.constructor) return false;
    if (a[EqualityTraitSymbol]) return equals(a, b);
    if (isArray(a)) {
      return every(
        a,
        (aitem) => some(b, (bitem) => shapeExtends(aitem, bitem))
      );
    } else if (isObject(a)) {
      return every2(
        a,
        (aitem, akey) => shapeExtends(aitem, b[akey])
      );
    }
    return false;
  };
  var Schema = class {
    /**
     * @param {Schema<any>} other
     */
    extends(other) {
      let [a, b] = [
        /** @type {any} */
        this.shape,
        /** @type {any} */
        other.shape
      ];
      if (
        /** @type {typeof Schema<any>} */
        this.constructor._dilutes
      ) [b, a] = [a, b];
      return shapeExtends(a, b);
    }
    /**
     * Overwrite this when necessary. By default, we only check the `shape` property which every shape
     * should have.
     * @param {Schema<any>} other
     */
    equals(other) {
      return this.constructor === other.constructor && equalityDeep(this.shape, other.shape);
    }
    [schemaSymbol]() {
      return true;
    }
    /**
     * @param {object} other
     */
    [EqualityTraitSymbol](other) {
      return this.equals(
        /** @type {any} */
        other
      );
    }
    /**
     * Use `schema.validate(obj)` with a typed parameter that is already of typed to be an instance of
     * Schema. Validate will check the structure of the parameter and return true iff the instance
     * really is an instance of Schema.
     *
     * @param {T} o
     * @return {boolean}
     */
    validate(o) {
      return this.check(o);
    }
    /* c8 ignore start */
    /**
     * Similar to validate, but this method accepts untyped parameters.
     *
     * @param {any} _o
     * @param {ValidationError} [_err]
     * @return {_o is T}
     */
    check(_o, _err) {
      methodUnimplemented();
    }
    /* c8 ignore stop */
    /**
     * @type {Schema<T?>}
     */
    get nullable() {
      return $union(this, $null);
    }
    /**
     * @type {$Optional<Schema<T>>}
     */
    get optional() {
      return new $Optional(
        /** @type {Schema<T>} */
        this
      );
    }
    /**
     * Cast a variable to a specific type. Returns the casted value, or throws an exception otherwise.
     * Use this if you know that the type is of a specific type and you just want to convince the type
     * system.
     *
     * **Do not rely on these error messages!**
     * Performs an assertion check only if not in a production environment.
     *
     * @template OO
     * @param {OO} o
     * @return {Extract<OO, T> extends never ? T : (OO extends Array<never> ? T : Extract<OO,T>)}
     */
    cast(o) {
      assert(o, this);
      return (
        /** @type {any} */
        o
      );
    }
    /**
     * EXPECTO PATRONUM!! 🪄
     * This function protects against type errors. Though it may not work in the real world.
     *
     * "After all this time?"
     * "Always." - Snape, talking about type safety
     *
     * Ensures that a variable is a a specific type. Returns the value, or throws an exception if the assertion check failed.
     * Use this if you know that the type is of a specific type and you just want to convince the type
     * system.
     *
     * Can be useful when defining lambdas: `s.lambda(s.$number, s.$void).expect((n) => n + 1)`
     *
     * **Do not rely on these error messages!**
     * Performs an assertion check if not in a production environment.
     *
     * @param {T} o
     * @return {o extends T ? T : never}
     */
    expect(o) {
      assert(o, this);
      return o;
    }
  };
  // this.shape must not be defined on Schema. Otherwise typecheck on metatypes (e.g. $$object) won't work as expected anymore
  /**
   * If true, the more things are added to the shape the more objects this schema will accept (e.g.
   * union). By default, the more objects are added, the the fewer objects this schema will accept.
   * @protected
   */
  __publicField(Schema, "_dilutes", false);
  var $ConstructedBy = class extends Schema {
    /**
     * @param {C} c
     * @param {((o:Instance<C>)=>boolean)|null} check
     */
    constructor(c, check) {
      super();
      this.shape = c;
      this._c = check;
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is C extends ((...args:any[]) => infer T) ? T : (C extends (new (...args:any[]) => any) ? InstanceType<C> : never)} o
     */
    check(o, err = void 0) {
      const c = o?.constructor === this.shape && (this._c == null || this._c(o));
      !c && err?.extend(null, this.shape.name, o?.constructor.name, o?.constructor !== this.shape ? "Constructor match failed" : "Check failed");
      return c;
    }
  };
  var $constructedBy = (c, check = null) => new $ConstructedBy(c, check);
  var $$constructedBy = $constructedBy($ConstructedBy);
  var $Custom = class extends Schema {
    /**
     * @param {(o:any) => boolean} check
     */
    constructor(check) {
      super();
      this.shape = check;
    }
    /**
     * @param {any} o
     * @param {ValidationError} err
     * @return {o is any}
     */
    check(o, err) {
      const c = this.shape(o);
      !c && err?.extend(null, "custom prop", o?.constructor.name, "failed to check custom prop");
      return c;
    }
  };
  var $custom = (check) => new $Custom(check);
  var $$custom = $constructedBy($Custom);
  var $Literal = class extends Schema {
    /**
     * @param {Array<T>} literals
     */
    constructor(literals) {
      super();
      this.shape = literals;
    }
    /**
     *
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is T}
     */
    check(o, err) {
      const c = this.shape.some((a) => a === o);
      !c && err?.extend(null, this.shape.join(" | "), o.toString());
      return c;
    }
  };
  var $literal = (...literals) => new $Literal(literals);
  var $$literal = $constructedBy($Literal);
  var _regexEscape = (
    /** @type {any} */
    RegExp.escape || /** @type {(str:string) => string} */
    ((str) => str.replace(/[().|&,$^[\]]/g, (s) => "\\" + s))
  );
  var _schemaStringTemplateToRegex = (s) => {
    if ($string.check(s)) {
      return [_regexEscape(s)];
    }
    if ($$literal.check(s)) {
      return (
        /** @type {Array<string|number>} */
        s.shape.map((v) => v + "")
      );
    }
    if ($$number.check(s)) {
      return ["[+-]?\\d+.?\\d*"];
    }
    if ($$string.check(s)) {
      return [".*"];
    }
    if ($$union.check(s)) {
      return s.shape.map(_schemaStringTemplateToRegex).flat(1);
    }
    unexpectedCase();
  };
  var $StringTemplate = class extends Schema {
    /**
     * @param {T} shape
     */
    constructor(shape) {
      super();
      this.shape = shape;
      this._r = new RegExp("^" + shape.map(_schemaStringTemplateToRegex).map((opts) => `(${opts.join("|")})`).join("") + "$");
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is CastStringTemplateArgsToTemplate<T>}
     */
    check(o, err) {
      const c = this._r.exec(o) != null;
      !c && err?.extend(null, this._r.toString(), o.toString(), "String doesn't match string template.");
      return c;
    }
  };
  var $$stringTemplate = $constructedBy($StringTemplate);
  var isOptionalSymbol = Symbol("optional");
  var $Optional = class extends Schema {
    /**
     * @param {S} shape
     */
    constructor(shape) {
      super();
      this.shape = shape;
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is (Unwrap<S>|undefined)}
     */
    check(o, err) {
      const c = o === void 0 || this.shape.check(o);
      !c && err?.extend(null, "undefined (optional)", "()");
      return c;
    }
    get [isOptionalSymbol]() {
      return true;
    }
  };
  var $$optional = $constructedBy($Optional);
  var $Never = class extends Schema {
    /**
     * @param {any} _o
     * @param {ValidationError} [err]
     * @return {_o is never}
     */
    check(_o, err) {
      err?.extend(null, "never", typeof _o);
      return false;
    }
  };
  var $never = new $Never();
  var $$never = $constructedBy($Never);
  var _$Object = class _$Object extends Schema {
    /**
     * @param {S} shape
     * @param {boolean} partial
     */
    constructor(shape, partial = false) {
      super();
      this.shape = shape;
      this._isPartial = partial;
    }
    /**
     * @type {Schema<Partial<$ObjectToType<S>>>}
     */
    get partial() {
      return new _$Object(this.shape, true);
    }
    /**
     * @param {any} o
     * @param {ValidationError} err
     * @return {o is $ObjectToType<S>}
     */
    check(o, err) {
      if (o == null) {
        err?.extend(null, "object", "null");
        return false;
      }
      return every2(this.shape, (vv, vk) => {
        const c = this._isPartial && !hasProperty(o, vk) || vv.check(o[vk], err);
        !c && err?.extend(vk.toString(), vv.toString(), typeof o[vk], "Object property does not match");
        return c;
      });
    }
  };
  __publicField(_$Object, "_dilutes", true);
  var $Object = _$Object;
  var $object = (def) => (
    /** @type {any} */
    new $Object(def)
  );
  var $$object = $constructedBy($Object);
  var $objectAny = $custom((o) => o != null && (o.constructor === Object || o.constructor == null));
  var $Record = class extends Schema {
    /**
     * @param {Keys} keys
     * @param {Values} values
     */
    constructor(keys3, values) {
      super();
      this.shape = {
        keys: keys3,
        values
      };
    }
    /**
     * @param {any} o
     * @param {ValidationError} err
     * @return {o is { [key in Unwrap<Keys>]: Unwrap<Values> }}
     */
    check(o, err) {
      return o != null && every2(o, (vv, vk) => {
        const ck = this.shape.keys.check(vk, err);
        !ck && err?.extend(vk + "", "Record", typeof o, ck ? "Key doesn't match schema" : "Value doesn't match value");
        return ck && this.shape.values.check(vv, err);
      });
    }
  };
  var $record = (keys3, values) => new $Record(keys3, values);
  var $$record = $constructedBy($Record);
  var $Tuple = class extends Schema {
    /**
     * @param {S} shape
     */
    constructor(shape) {
      super();
      this.shape = shape;
    }
    /**
     * @param {any} o
     * @param {ValidationError} err
     * @return {o is { [K in keyof S]: S[K] extends Schema<infer Type> ? Type : never }}
     */
    check(o, err) {
      return o != null && every2(this.shape, (vv, vk) => {
        const c = (
          /** @type {Schema<any>} */
          vv.check(o[vk], err)
        );
        !c && err?.extend(vk.toString(), "Tuple", typeof vv);
        return c;
      });
    }
  };
  var $tuple = (...def) => new $Tuple(def);
  var $$tuple = $constructedBy($Tuple);
  var $Array = class extends Schema {
    /**
     * @param {Array<S>} v
     */
    constructor(v) {
      super();
      this.shape = v.length === 1 ? v[0] : new $Union(v);
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is Array<S extends Schema<infer T> ? T : never>} o
     */
    check(o, err) {
      const c = isArray(o) && every(o, (oi) => this.shape.check(oi));
      !c && err?.extend(null, "Array", "");
      return c;
    }
  };
  var $array = (...def) => new $Array(def);
  var $$array = $constructedBy($Array);
  var $arrayAny = $custom((o) => isArray(o));
  var $InstanceOf = class extends Schema {
    /**
     * @param {new (...args:any) => T} constructor
     * @param {((o:T) => boolean)|null} check
     */
    constructor(constructor, check) {
      super();
      this.shape = constructor;
      this._c = check;
    }
    /**
     * @param {any} o
     * @param {ValidationError} err
     * @return {o is T}
     */
    check(o, err) {
      const c = o instanceof this.shape && (this._c == null || this._c(o));
      !c && err?.extend(null, this.shape.name, o?.constructor.name);
      return c;
    }
  };
  var $instanceOf = (c, check = null) => new $InstanceOf(c, check);
  var $$instanceOf = $constructedBy($InstanceOf);
  var $$schema = $instanceOf(Schema);
  var $Lambda = class extends Schema {
    /**
     * @param {Args} args
     */
    constructor(args2) {
      super();
      this.len = args2.length - 1;
      this.args = $tuple(...args2.slice(-1));
      this.res = args2[this.len];
    }
    /**
     * @param {any} f
     * @param {ValidationError} err
     * @return {f is _LArgsToLambdaDef<Args>}
     */
    check(f, err) {
      const c = f.constructor === Function && f.length <= this.len;
      !c && err?.extend(null, "function", typeof f);
      return c;
    }
  };
  var $$lambda = $constructedBy($Lambda);
  var $function = $custom((o) => typeof o === "function");
  var $Intersection = class extends Schema {
    /**
     * @param {T} v
     */
    constructor(v) {
      super();
      this.shape = v;
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is Intersect<UnwrapArray<T>>}
     */
    check(o, err) {
      const c = every(this.shape, (check) => check.check(o, err));
      !c && err?.extend(null, "Intersectinon", typeof o);
      return c;
    }
  };
  var $$intersect = $constructedBy($Intersection, (o) => o.shape.length > 0);
  var $Union = class extends Schema {
    /**
     * @param {Array<Schema<S>>} v
     */
    constructor(v) {
      super();
      this.shape = v;
    }
    /**
     * @param {any} o
     * @param {ValidationError} [err]
     * @return {o is S}
     */
    check(o, err) {
      const c = some(this.shape, (vv) => vv.check(o, err));
      err?.extend(null, "Union", typeof o);
      return c;
    }
  };
  __publicField($Union, "_dilutes", true);
  var $union = (...schemas) => schemas.findIndex(($s) => $$union.check($s)) >= 0 ? $union(...schemas.map(($s) => $($s)).map(($s) => $$union.check($s) ? $s.shape : [$s]).flat(1)) : schemas.length === 1 ? schemas[0] : new $Union(schemas);
  var $$union = (
    /** @type {Schema<$Union<any>>} */
    $constructedBy($Union)
  );
  var _t = () => true;
  var $any = $custom(_t);
  var $$any = (
    /** @type {Schema<Schema<any>>} */
    $constructedBy($Custom, (o) => o.shape === _t)
  );
  var $bigint = $custom((o) => typeof o === "bigint");
  var $$bigint = (
    /** @type {Schema<Schema<BigInt>>} */
    $custom((o) => o === $bigint)
  );
  var $symbol = $custom((o) => typeof o === "symbol");
  var $$symbol = (
    /** @type {Schema<Schema<Symbol>>} */
    $custom((o) => o === $symbol)
  );
  var $number = $custom((o) => typeof o === "number");
  var $$number = (
    /** @type {Schema<Schema<number>>} */
    $custom((o) => o === $number)
  );
  var $string = $custom((o) => typeof o === "string");
  var $$string = (
    /** @type {Schema<Schema<string>>} */
    $custom((o) => o === $string)
  );
  var $boolean = $custom((o) => typeof o === "boolean");
  var $$boolean = (
    /** @type {Schema<Schema<Boolean>>} */
    $custom((o) => o === $boolean)
  );
  var $undefined = $literal(void 0);
  var $$undefined = (
    /** @type {Schema<Schema<undefined>>} */
    $constructedBy($Literal, (o) => o.shape.length === 1 && o.shape[0] === void 0)
  );
  var $void = $literal(void 0);
  var $null = $literal(null);
  var $$null = (
    /** @type {Schema<Schema<null>>} */
    $constructedBy($Literal, (o) => o.shape.length === 1 && o.shape[0] === null)
  );
  var $uint8Array = $constructedBy(Uint8Array);
  var $$uint8Array = (
    /** @type {Schema<Schema<Uint8Array>>} */
    $constructedBy($ConstructedBy, (o) => o.shape === Uint8Array)
  );
  var $primitive = $union($number, $string, $null, $undefined, $bigint, $boolean, $symbol);
  var $json = (() => {
    const $jsonArr = (
      /** @type {$Array<$any>} */
      $array($any)
    );
    const $jsonRecord = (
      /** @type {$Record<$string,$any>} */
      $record($string, $any)
    );
    const $json2 = $union($number, $string, $null, $boolean, $jsonArr, $jsonRecord);
    $jsonArr.shape = $json2;
    $jsonRecord.shape.values = $json2;
    return $json2;
  })();
  var $ = (o) => {
    if ($$schema.check(o)) {
      return (
        /** @type {any} */
        o
      );
    } else if ($objectAny.check(o)) {
      const o2 = {};
      for (const k in o) {
        o2[k] = $(o[k]);
      }
      return (
        /** @type {any} */
        $object(o2)
      );
    } else if ($arrayAny.check(o)) {
      return (
        /** @type {any} */
        $union(...o.map($))
      );
    } else if ($primitive.check(o)) {
      return (
        /** @type {any} */
        $literal(o)
      );
    } else if ($function.check(o)) {
      return (
        /** @type {any} */
        $constructedBy(
          /** @type {any} */
          o
        )
      );
    }
    unexpectedCase();
  };
  var assert = production ? () => {
  } : (o, schema) => {
    const err = new ValidationError();
    if (!schema.check(o, err)) {
      throw create3(`Expected value to be of type ${schema.constructor.name}.
${err.toString()}`);
    }
  };
  var PatternMatcher = class {
    /**
     * @param {Schema<State>} [$state]
     */
    constructor($state) {
      this.patterns = [];
      this.$state = $state;
    }
    /**
     * @template P
     * @template R
     * @param {P} pattern
     * @param {(o:NoInfer<Unwrap<ReadSchema<P>>>,s:State)=>R} handler
     * @return {PatternMatcher<State,Patterns|Pattern<Unwrap<ReadSchema<P>>,R>>}
     */
    if(pattern, handler) {
      this.patterns.push({ if: $(pattern), h: handler });
      return this;
    }
    /**
     * @template R
     * @param {(o:any,s:State)=>R} h
     */
    else(h) {
      return this.if($any, h);
    }
    /**
     * @return {State extends undefined
     *   ? <In extends Unwrap<Patterns['if']>>(o:In,state?:undefined)=>PatternMatchResult<Patterns,In>
     *   : <In extends Unwrap<Patterns['if']>>(o:In,state:State)=>PatternMatchResult<Patterns,In>}
     */
    done() {
      return (
        /** @type {any} */
        (o, s) => {
          for (let i = 0; i < this.patterns.length; i++) {
            const p = this.patterns[i];
            if (p.if.check(o)) {
              return p.h(o, s);
            }
          }
          throw create3("Unhandled pattern");
        }
      );
    }
  };
  var match = (state) => new PatternMatcher(
    /** @type {any} */
    state
  );
  var _random = (
    /** @type {any} */
    match(
      /** @type {Schema<prng.PRNG>} */
      $any
    ).if($$number, (_o, gen) => int53(gen, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER)).if($$string, (_o, gen) => word(gen)).if($$boolean, (_o, gen) => bool(gen)).if($$bigint, (_o, gen) => BigInt(int53(gen, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER))).if($$union, (o, gen) => random(gen, oneOf(gen, o.shape))).if($$object, (o, gen) => {
      const res = {};
      for (const k in o.shape) {
        let prop = o.shape[k];
        if ($$optional.check(prop)) {
          if (bool(gen)) {
            continue;
          }
          prop = prop.shape;
        }
        res[k] = _random(prop, gen);
      }
      return res;
    }).if($$array, (o, gen) => {
      const arr = [];
      const n = int32(gen, 0, 42);
      for (let i = 0; i < n; i++) {
        arr.push(random(gen, o.shape));
      }
      return arr;
    }).if($$literal, (o, gen) => {
      return oneOf(gen, o.shape);
    }).if($$null, (o, gen) => {
      return null;
    }).if($$lambda, (o, gen) => {
      const res = random(gen, o.res);
      return () => res;
    }).if($$any, (o, gen) => random(gen, oneOf(gen, [
      $number,
      $string,
      $null,
      $undefined,
      $bigint,
      $boolean,
      $array($number),
      $record($union("a", "b", "c"), $number)
    ]))).if($$record, (o, gen) => {
      const res = {};
      const keysN = int53(gen, 0, 3);
      for (let i = 0; i < keysN; i++) {
        const key = random(gen, o.shape.keys);
        const val = random(gen, o.shape.values);
        res[key] = val;
      }
      return res;
    }).done()
  );
  var random = (gen, schema) => (
    /** @type {any} */
    _random($(schema), gen)
  );

  // node_modules/lib0/dom.js
  var doc = (
    /** @type {Document} */
    typeof document !== "undefined" ? document : {}
  );
  var $fragment = $custom((el) => el.nodeType === DOCUMENT_FRAGMENT_NODE);
  var domParser = (
    /** @type {DOMParser} */
    typeof DOMParser !== "undefined" ? new DOMParser() : null
  );
  var $element = $custom((el) => el.nodeType === ELEMENT_NODE);
  var $text = $custom((el) => el.nodeType === TEXT_NODE);
  var mapToStyleString = (m) => map(m, (value, key) => `${key}:${value};`).join("");
  var ELEMENT_NODE = doc.ELEMENT_NODE;
  var TEXT_NODE = doc.TEXT_NODE;
  var CDATA_SECTION_NODE = doc.CDATA_SECTION_NODE;
  var COMMENT_NODE = doc.COMMENT_NODE;
  var DOCUMENT_NODE = doc.DOCUMENT_NODE;
  var DOCUMENT_TYPE_NODE = doc.DOCUMENT_TYPE_NODE;
  var DOCUMENT_FRAGMENT_NODE = doc.DOCUMENT_FRAGMENT_NODE;
  var $node = $custom((el) => el.nodeType === DOCUMENT_NODE);

  // node_modules/lib0/symbol.js
  var create6 = Symbol;

  // node_modules/lib0/logging.common.js
  var BOLD = create6();
  var UNBOLD = create6();
  var BLUE = create6();
  var GREY = create6();
  var GREEN = create6();
  var RED = create6();
  var PURPLE = create6();
  var ORANGE = create6();
  var UNCOLOR = create6();
  var computeNoColorLoggingArgs = (args2) => {
    if (args2.length === 1 && args2[0]?.constructor === Function) {
      args2 = /** @type {Array<string|Symbol|Object|number>} */
      /** @type {[function]} */
      args2[0]();
    }
    const strBuilder = [];
    const logArgs = [];
    let i = 0;
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (arg === void 0) {
        break;
      } else if (arg.constructor === String || arg.constructor === Number) {
        strBuilder.push(arg);
      } else if (arg.constructor === Object) {
        break;
      }
    }
    if (i > 0) {
      logArgs.push(strBuilder.join(""));
    }
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (!(arg instanceof Symbol)) {
        logArgs.push(arg);
      }
    }
    return logArgs;
  };
  var lastLoggingTime = getUnixTime();

  // node_modules/lib0/logging.js
  var _browserStyleMap = {
    [BOLD]: create5("font-weight", "bold"),
    [UNBOLD]: create5("font-weight", "normal"),
    [BLUE]: create5("color", "blue"),
    [GREEN]: create5("color", "green"),
    [GREY]: create5("color", "grey"),
    [RED]: create5("color", "red"),
    [PURPLE]: create5("color", "purple"),
    [ORANGE]: create5("color", "orange"),
    // not well supported in chrome when debugging node with inspector - TODO: deprecate
    [UNCOLOR]: create5("color", "black")
  };
  var computeBrowserLoggingArgs = (args2) => {
    if (args2.length === 1 && args2[0]?.constructor === Function) {
      args2 = /** @type {Array<string|Symbol|Object|number>} */
      /** @type {[function]} */
      args2[0]();
    }
    const strBuilder = [];
    const styles = [];
    const currentStyle = create();
    let logArgs = [];
    let i = 0;
    for (; i < args2.length; i++) {
      const arg = args2[i];
      const style = _browserStyleMap[arg];
      if (style !== void 0) {
        currentStyle.set(style.left, style.right);
      } else {
        if (arg === void 0) {
          break;
        }
        if (arg.constructor === String || arg.constructor === Number) {
          const style2 = mapToStyleString(currentStyle);
          if (i > 0 || style2.length > 0) {
            strBuilder.push("%c" + arg);
            styles.push(style2);
          } else {
            strBuilder.push(arg);
          }
        } else {
          break;
        }
      }
    }
    if (i > 0) {
      logArgs = styles;
      logArgs.unshift(strBuilder.join(""));
    }
    for (; i < args2.length; i++) {
      const arg = args2[i];
      if (!(arg instanceof Symbol)) {
        logArgs.push(arg);
      }
    }
    return logArgs;
  };
  var computeLoggingArgs = supportsColor ? computeBrowserLoggingArgs : computeNoColorLoggingArgs;
  var print = (...args2) => {
    console.log(...computeLoggingArgs(args2));
    vconsoles.forEach((vc) => vc.print(args2));
  };
  var warn = (...args2) => {
    console.warn(...computeLoggingArgs(args2));
    args2.unshift(ORANGE);
    vconsoles.forEach((vc) => vc.print(args2));
  };
  var vconsoles = create2();

  // node_modules/lib0/iterator.js
  var createIterator = (next) => ({
    /**
     * @return {IterableIterator<T>}
     */
    [Symbol.iterator]() {
      return this;
    },
    // @ts-ignore
    next
  });
  var iteratorFilter = (iterator, filter) => createIterator(() => {
    let res;
    do {
      res = iterator.next();
    } while (!res.done && !filter(res.value));
    return res;
  });
  var iteratorMap = (iterator, fmap) => createIterator(() => {
    const { done, value } = iterator.next();
    return { done, value: done ? void 0 : fmap(value) };
  });

  // node_modules/yjs/dist/yjs.mjs
  var DeleteItem = class {
    /**
     * @param {number} clock
     * @param {number} len
     */
    constructor(clock, len) {
      this.clock = clock;
      this.len = len;
    }
  };
  var DeleteSet = class {
    constructor() {
      this.clients = /* @__PURE__ */ new Map();
    }
  };
  var iterateDeletedStructs = (transaction, ds, f) => ds.clients.forEach((deletes, clientid) => {
    const structs = (
      /** @type {Array<GC|Item>} */
      transaction.doc.store.clients.get(clientid)
    );
    if (structs != null) {
      const lastStruct = structs[structs.length - 1];
      const clockState = lastStruct.id.clock + lastStruct.length;
      for (let i = 0, del = deletes[i]; i < deletes.length && del.clock < clockState; del = deletes[++i]) {
        iterateStructs(transaction, structs, del.clock, del.len, f);
      }
    }
  });
  var findIndexDS = (dis, clock) => {
    let left = 0;
    let right = dis.length - 1;
    while (left <= right) {
      const midindex = floor((left + right) / 2);
      const mid = dis[midindex];
      const midclock = mid.clock;
      if (midclock <= clock) {
        if (clock < midclock + mid.len) {
          return midindex;
        }
        left = midindex + 1;
      } else {
        right = midindex - 1;
      }
    }
    return null;
  };
  var isDeleted = (ds, id2) => {
    const dis = ds.clients.get(id2.client);
    return dis !== void 0 && findIndexDS(dis, id2.clock) !== null;
  };
  var sortAndMergeDeleteSet = (ds) => {
    ds.clients.forEach((dels) => {
      dels.sort((a, b) => a.clock - b.clock);
      let i, j;
      for (i = 1, j = 1; i < dels.length; i++) {
        const left = dels[j - 1];
        const right = dels[i];
        if (left.clock + left.len >= right.clock) {
          dels[j - 1] = new DeleteItem(left.clock, max(left.len, right.clock + right.len - left.clock));
        } else {
          if (j < i) {
            dels[j] = right;
          }
          j++;
        }
      }
      dels.length = j;
    });
  };
  var mergeDeleteSets = (dss) => {
    const merged = new DeleteSet();
    for (let dssI = 0; dssI < dss.length; dssI++) {
      dss[dssI].clients.forEach((delsLeft, client) => {
        if (!merged.clients.has(client)) {
          const dels = delsLeft.slice();
          for (let i = dssI + 1; i < dss.length; i++) {
            appendTo(dels, dss[i].clients.get(client) || []);
          }
          merged.clients.set(client, dels);
        }
      });
    }
    sortAndMergeDeleteSet(merged);
    return merged;
  };
  var addToDeleteSet = (ds, client, clock, length3) => {
    setIfUndefined(ds.clients, client, () => (
      /** @type {Array<DeleteItem>} */
      []
    )).push(new DeleteItem(clock, length3));
  };
  var createDeleteSet = () => new DeleteSet();
  var createDeleteSetFromStructStore = (ss) => {
    const ds = createDeleteSet();
    ss.clients.forEach((structs, client) => {
      const dsitems = [];
      for (let i = 0; i < structs.length; i++) {
        const struct = structs[i];
        if (struct.deleted) {
          const clock = struct.id.clock;
          let len = struct.length;
          if (i + 1 < structs.length) {
            for (let next = structs[i + 1]; i + 1 < structs.length && next.deleted; next = structs[++i + 1]) {
              len += next.length;
            }
          }
          dsitems.push(new DeleteItem(clock, len));
        }
      }
      if (dsitems.length > 0) {
        ds.clients.set(client, dsitems);
      }
    });
    return ds;
  };
  var writeDeleteSet = (encoder, ds) => {
    writeVarUint(encoder.restEncoder, ds.clients.size);
    from(ds.clients.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, dsitems]) => {
      encoder.resetDsCurVal();
      writeVarUint(encoder.restEncoder, client);
      const len = dsitems.length;
      writeVarUint(encoder.restEncoder, len);
      for (let i = 0; i < len; i++) {
        const item = dsitems[i];
        encoder.writeDsClock(item.clock);
        encoder.writeDsLen(item.len);
      }
    });
  };
  var readDeleteSet = (decoder) => {
    const ds = new DeleteSet();
    const numClients = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numClients; i++) {
      decoder.resetDsCurVal();
      const client = readVarUint(decoder.restDecoder);
      const numberOfDeletes = readVarUint(decoder.restDecoder);
      if (numberOfDeletes > 0) {
        const dsField = setIfUndefined(ds.clients, client, () => (
          /** @type {Array<DeleteItem>} */
          []
        ));
        for (let i2 = 0; i2 < numberOfDeletes; i2++) {
          dsField.push(new DeleteItem(decoder.readDsClock(), decoder.readDsLen()));
        }
      }
    }
    return ds;
  };
  var readAndApplyDeleteSet = (decoder, transaction, store) => {
    const unappliedDS = new DeleteSet();
    const numClients = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numClients; i++) {
      decoder.resetDsCurVal();
      const client = readVarUint(decoder.restDecoder);
      const numberOfDeletes = readVarUint(decoder.restDecoder);
      const structs = store.clients.get(client) || [];
      const state = getState(store, client);
      for (let i2 = 0; i2 < numberOfDeletes; i2++) {
        const clock = decoder.readDsClock();
        const clockEnd = clock + decoder.readDsLen();
        if (clock < state) {
          if (state < clockEnd) {
            addToDeleteSet(unappliedDS, client, state, clockEnd - state);
          }
          let index = findIndexSS(structs, clock);
          let struct = structs[index];
          if (!struct.deleted && struct.id.clock < clock) {
            structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
            index++;
          }
          while (index < structs.length) {
            struct = structs[index++];
            if (struct.id.clock < clockEnd) {
              if (!struct.deleted) {
                if (clockEnd < struct.id.clock + struct.length) {
                  structs.splice(index, 0, splitItem(transaction, struct, clockEnd - struct.id.clock));
                }
                struct.delete(transaction);
              }
            } else {
              break;
            }
          }
        } else {
          addToDeleteSet(unappliedDS, client, clock, clockEnd - clock);
        }
      }
    }
    if (unappliedDS.clients.size > 0) {
      const ds = new UpdateEncoderV2();
      writeVarUint(ds.restEncoder, 0);
      writeDeleteSet(ds, unappliedDS);
      return ds.toUint8Array();
    }
    return null;
  };
  var generateNewClientId = uint32;
  var Doc = class _Doc extends ObservableV2 {
    /**
     * @param {DocOpts} opts configuration
     */
    constructor({ guid = uuidv4(), collectionid = null, gc = true, gcFilter = () => true, meta = null, autoLoad = false, shouldLoad = true } = {}) {
      super();
      this.gc = gc;
      this.gcFilter = gcFilter;
      this.clientID = generateNewClientId();
      this.guid = guid;
      this.collectionid = collectionid;
      this.share = /* @__PURE__ */ new Map();
      this.store = new StructStore();
      this._transaction = null;
      this._transactionCleanups = [];
      this.subdocs = /* @__PURE__ */ new Set();
      this._item = null;
      this.shouldLoad = shouldLoad;
      this.autoLoad = autoLoad;
      this.meta = meta;
      this.isLoaded = false;
      this.isSynced = false;
      this.isDestroyed = false;
      this.whenLoaded = create4((resolve) => {
        this.on("load", () => {
          this.isLoaded = true;
          resolve(this);
        });
      });
      const provideSyncedPromise = () => create4((resolve) => {
        const eventHandler = (isSynced) => {
          if (isSynced === void 0 || isSynced === true) {
            this.off("sync", eventHandler);
            resolve();
          }
        };
        this.on("sync", eventHandler);
      });
      this.on("sync", (isSynced) => {
        if (isSynced === false && this.isSynced) {
          this.whenSynced = provideSyncedPromise();
        }
        this.isSynced = isSynced === void 0 || isSynced === true;
        if (this.isSynced && !this.isLoaded) {
          this.emit("load", [this]);
        }
      });
      this.whenSynced = provideSyncedPromise();
    }
    /**
     * Notify the parent document that you request to load data into this subdocument (if it is a subdocument).
     *
     * `load()` might be used in the future to request any provider to load the most current data.
     *
     * It is safe to call `load()` multiple times.
     */
    load() {
      const item = this._item;
      if (item !== null && !this.shouldLoad) {
        transact(
          /** @type {any} */
          item.parent.doc,
          (transaction) => {
            transaction.subdocsLoaded.add(this);
          },
          null,
          true
        );
      }
      this.shouldLoad = true;
    }
    getSubdocs() {
      return this.subdocs;
    }
    getSubdocGuids() {
      return new Set(from(this.subdocs).map((doc2) => doc2.guid));
    }
    /**
     * Changes that happen inside of a transaction are bundled. This means that
     * the observer fires _after_ the transaction is finished and that all changes
     * that happened inside of the transaction are sent as one message to the
     * other peers.
     *
     * @template T
     * @param {function(Transaction):T} f The function that should be executed as a transaction
     * @param {any} [origin] Origin of who started the transaction. Will be stored on transaction.origin
     * @return T
     *
     * @public
     */
    transact(f, origin = null) {
      return transact(this, f, origin);
    }
    /**
     * Define a shared data type.
     *
     * Multiple calls of `ydoc.get(name, TypeConstructor)` yield the same result
     * and do not overwrite each other. I.e.
     * `ydoc.get(name, Y.Array) === ydoc.get(name, Y.Array)`
     *
     * After this method is called, the type is also available on `ydoc.share.get(name)`.
     *
     * *Best Practices:*
     * Define all types right after the Y.Doc instance is created and store them in a separate object.
     * Also use the typed methods `getText(name)`, `getArray(name)`, ..
     *
     * @template {typeof AbstractType<any>} Type
     * @example
     *   const ydoc = new Y.Doc(..)
     *   const appState = {
     *     document: ydoc.getText('document')
     *     comments: ydoc.getArray('comments')
     *   }
     *
     * @param {string} name
     * @param {Type} TypeConstructor The constructor of the type definition. E.g. Y.Text, Y.Array, Y.Map, ...
     * @return {InstanceType<Type>} The created type. Constructed with TypeConstructor
     *
     * @public
     */
    get(name, TypeConstructor = (
      /** @type {any} */
      AbstractType
    )) {
      const type = setIfUndefined(this.share, name, () => {
        const t = new TypeConstructor();
        t._integrate(this, null);
        return t;
      });
      const Constr = type.constructor;
      if (TypeConstructor !== AbstractType && Constr !== TypeConstructor) {
        if (Constr === AbstractType) {
          const t = new TypeConstructor();
          t._map = type._map;
          type._map.forEach(
            /** @param {Item?} n */
            (n) => {
              for (; n !== null; n = n.left) {
                n.parent = t;
              }
            }
          );
          t._start = type._start;
          for (let n = t._start; n !== null; n = n.right) {
            n.parent = t;
          }
          t._length = type._length;
          this.share.set(name, t);
          t._integrate(this, null);
          return (
            /** @type {InstanceType<Type>} */
            t
          );
        } else {
          throw new Error(`Type with the name ${name} has already been defined with a different constructor`);
        }
      }
      return (
        /** @type {InstanceType<Type>} */
        type
      );
    }
    /**
     * @template T
     * @param {string} [name]
     * @return {YArray<T>}
     *
     * @public
     */
    getArray(name = "") {
      return (
        /** @type {YArray<T>} */
        this.get(name, YArray)
      );
    }
    /**
     * @param {string} [name]
     * @return {YText}
     *
     * @public
     */
    getText(name = "") {
      return this.get(name, YText);
    }
    /**
     * @template T
     * @param {string} [name]
     * @return {YMap<T>}
     *
     * @public
     */
    getMap(name = "") {
      return (
        /** @type {YMap<T>} */
        this.get(name, YMap)
      );
    }
    /**
     * @param {string} [name]
     * @return {YXmlElement}
     *
     * @public
     */
    getXmlElement(name = "") {
      return (
        /** @type {YXmlElement<{[key:string]:string}>} */
        this.get(name, YXmlElement)
      );
    }
    /**
     * @param {string} [name]
     * @return {YXmlFragment}
     *
     * @public
     */
    getXmlFragment(name = "") {
      return this.get(name, YXmlFragment);
    }
    /**
     * Converts the entire document into a js object, recursively traversing each yjs type
     * Doesn't log types that have not been defined (using ydoc.getType(..)).
     *
     * @deprecated Do not use this method and rather call toJSON directly on the shared types.
     *
     * @return {Object<string, any>}
     */
    toJSON() {
      const doc2 = {};
      this.share.forEach((value, key) => {
        doc2[key] = value.toJSON();
      });
      return doc2;
    }
    /**
     * Emit `destroy` event and unregister all event handlers.
     */
    destroy() {
      this.isDestroyed = true;
      from(this.subdocs).forEach((subdoc) => subdoc.destroy());
      const item = this._item;
      if (item !== null) {
        this._item = null;
        const content = (
          /** @type {ContentDoc} */
          item.content
        );
        content.doc = new _Doc({ guid: this.guid, ...content.opts, shouldLoad: false });
        content.doc._item = item;
        transact(
          /** @type {any} */
          item.parent.doc,
          (transaction) => {
            const doc2 = content.doc;
            if (!item.deleted) {
              transaction.subdocsAdded.add(doc2);
            }
            transaction.subdocsRemoved.add(this);
          },
          null,
          true
        );
      }
      this.emit("destroyed", [true]);
      this.emit("destroy", [this]);
      super.destroy();
    }
  };
  var DSDecoderV1 = class {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      this.restDecoder = decoder;
    }
    resetDsCurVal() {
    }
    /**
     * @return {number}
     */
    readDsClock() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {number}
     */
    readDsLen() {
      return readVarUint(this.restDecoder);
    }
  };
  var UpdateDecoderV1 = class extends DSDecoderV1 {
    /**
     * @return {ID}
     */
    readLeftID() {
      return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
    }
    /**
     * @return {ID}
     */
    readRightID() {
      return createID(readVarUint(this.restDecoder), readVarUint(this.restDecoder));
    }
    /**
     * Read the next client id.
     * Use this in favor of readID whenever possible to reduce the number of objects created.
     */
    readClient() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readInfo() {
      return readUint8(this.restDecoder);
    }
    /**
     * @return {string}
     */
    readString() {
      return readVarString(this.restDecoder);
    }
    /**
     * @return {boolean} isKey
     */
    readParentInfo() {
      return readVarUint(this.restDecoder) === 1;
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readTypeRef() {
      return readVarUint(this.restDecoder);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @return {number} len
     */
    readLen() {
      return readVarUint(this.restDecoder);
    }
    /**
     * @return {any}
     */
    readAny() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {Uint8Array}
     */
    readBuf() {
      return copyUint8Array(readVarUint8Array(this.restDecoder));
    }
    /**
     * Legacy implementation uses JSON parse. We use any-decoding in v2.
     *
     * @return {any}
     */
    readJSON() {
      return JSON.parse(readVarString(this.restDecoder));
    }
    /**
     * @return {string}
     */
    readKey() {
      return readVarString(this.restDecoder);
    }
  };
  var DSDecoderV2 = class {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      this.dsCurrVal = 0;
      this.restDecoder = decoder;
    }
    resetDsCurVal() {
      this.dsCurrVal = 0;
    }
    /**
     * @return {number}
     */
    readDsClock() {
      this.dsCurrVal += readVarUint(this.restDecoder);
      return this.dsCurrVal;
    }
    /**
     * @return {number}
     */
    readDsLen() {
      const diff = readVarUint(this.restDecoder) + 1;
      this.dsCurrVal += diff;
      return diff;
    }
  };
  var UpdateDecoderV2 = class extends DSDecoderV2 {
    /**
     * @param {decoding.Decoder} decoder
     */
    constructor(decoder) {
      super(decoder);
      this.keys = [];
      readVarUint(decoder);
      this.keyClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.clientDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
      this.leftClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.rightClockDecoder = new IntDiffOptRleDecoder(readVarUint8Array(decoder));
      this.infoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
      this.stringDecoder = new StringDecoder(readVarUint8Array(decoder));
      this.parentInfoDecoder = new RleDecoder(readVarUint8Array(decoder), readUint8);
      this.typeRefDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
      this.lenDecoder = new UintOptRleDecoder(readVarUint8Array(decoder));
    }
    /**
     * @return {ID}
     */
    readLeftID() {
      return new ID(this.clientDecoder.read(), this.leftClockDecoder.read());
    }
    /**
     * @return {ID}
     */
    readRightID() {
      return new ID(this.clientDecoder.read(), this.rightClockDecoder.read());
    }
    /**
     * Read the next client id.
     * Use this in favor of readID whenever possible to reduce the number of objects created.
     */
    readClient() {
      return this.clientDecoder.read();
    }
    /**
     * @return {number} info An unsigned 8-bit integer
     */
    readInfo() {
      return (
        /** @type {number} */
        this.infoDecoder.read()
      );
    }
    /**
     * @return {string}
     */
    readString() {
      return this.stringDecoder.read();
    }
    /**
     * @return {boolean}
     */
    readParentInfo() {
      return this.parentInfoDecoder.read() === 1;
    }
    /**
     * @return {number} An unsigned 8-bit integer
     */
    readTypeRef() {
      return this.typeRefDecoder.read();
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @return {number}
     */
    readLen() {
      return this.lenDecoder.read();
    }
    /**
     * @return {any}
     */
    readAny() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {Uint8Array}
     */
    readBuf() {
      return readVarUint8Array(this.restDecoder);
    }
    /**
     * This is mainly here for legacy purposes.
     *
     * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
     *
     * @return {any}
     */
    readJSON() {
      return readAny(this.restDecoder);
    }
    /**
     * @return {string}
     */
    readKey() {
      const keyClock = this.keyClockDecoder.read();
      if (keyClock < this.keys.length) {
        return this.keys[keyClock];
      } else {
        const key = this.stringDecoder.read();
        this.keys.push(key);
        return key;
      }
    }
  };
  var DSEncoderV1 = class {
    constructor() {
      this.restEncoder = createEncoder();
    }
    toUint8Array() {
      return toUint8Array(this.restEncoder);
    }
    resetDsCurVal() {
    }
    /**
     * @param {number} clock
     */
    writeDsClock(clock) {
      writeVarUint(this.restEncoder, clock);
    }
    /**
     * @param {number} len
     */
    writeDsLen(len) {
      writeVarUint(this.restEncoder, len);
    }
  };
  var UpdateEncoderV1 = class extends DSEncoderV1 {
    /**
     * @param {ID} id
     */
    writeLeftID(id2) {
      writeVarUint(this.restEncoder, id2.client);
      writeVarUint(this.restEncoder, id2.clock);
    }
    /**
     * @param {ID} id
     */
    writeRightID(id2) {
      writeVarUint(this.restEncoder, id2.client);
      writeVarUint(this.restEncoder, id2.clock);
    }
    /**
     * Use writeClient and writeClock instead of writeID if possible.
     * @param {number} client
     */
    writeClient(client) {
      writeVarUint(this.restEncoder, client);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeInfo(info) {
      writeUint8(this.restEncoder, info);
    }
    /**
     * @param {string} s
     */
    writeString(s) {
      writeVarString(this.restEncoder, s);
    }
    /**
     * @param {boolean} isYKey
     */
    writeParentInfo(isYKey) {
      writeVarUint(this.restEncoder, isYKey ? 1 : 0);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeTypeRef(info) {
      writeVarUint(this.restEncoder, info);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @param {number} len
     */
    writeLen(len) {
      writeVarUint(this.restEncoder, len);
    }
    /**
     * @param {any} any
     */
    writeAny(any2) {
      writeAny(this.restEncoder, any2);
    }
    /**
     * @param {Uint8Array} buf
     */
    writeBuf(buf) {
      writeVarUint8Array(this.restEncoder, buf);
    }
    /**
     * @param {any} embed
     */
    writeJSON(embed) {
      writeVarString(this.restEncoder, JSON.stringify(embed));
    }
    /**
     * @param {string} key
     */
    writeKey(key) {
      writeVarString(this.restEncoder, key);
    }
  };
  var DSEncoderV2 = class {
    constructor() {
      this.restEncoder = createEncoder();
      this.dsCurrVal = 0;
    }
    toUint8Array() {
      return toUint8Array(this.restEncoder);
    }
    resetDsCurVal() {
      this.dsCurrVal = 0;
    }
    /**
     * @param {number} clock
     */
    writeDsClock(clock) {
      const diff = clock - this.dsCurrVal;
      this.dsCurrVal = clock;
      writeVarUint(this.restEncoder, diff);
    }
    /**
     * @param {number} len
     */
    writeDsLen(len) {
      if (len === 0) {
        unexpectedCase();
      }
      writeVarUint(this.restEncoder, len - 1);
      this.dsCurrVal += len;
    }
  };
  var UpdateEncoderV2 = class extends DSEncoderV2 {
    constructor() {
      super();
      this.keyMap = /* @__PURE__ */ new Map();
      this.keyClock = 0;
      this.keyClockEncoder = new IntDiffOptRleEncoder();
      this.clientEncoder = new UintOptRleEncoder();
      this.leftClockEncoder = new IntDiffOptRleEncoder();
      this.rightClockEncoder = new IntDiffOptRleEncoder();
      this.infoEncoder = new RleEncoder(writeUint8);
      this.stringEncoder = new StringEncoder();
      this.parentInfoEncoder = new RleEncoder(writeUint8);
      this.typeRefEncoder = new UintOptRleEncoder();
      this.lenEncoder = new UintOptRleEncoder();
    }
    toUint8Array() {
      const encoder = createEncoder();
      writeVarUint(encoder, 0);
      writeVarUint8Array(encoder, this.keyClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.clientEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.leftClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.rightClockEncoder.toUint8Array());
      writeVarUint8Array(encoder, toUint8Array(this.infoEncoder));
      writeVarUint8Array(encoder, this.stringEncoder.toUint8Array());
      writeVarUint8Array(encoder, toUint8Array(this.parentInfoEncoder));
      writeVarUint8Array(encoder, this.typeRefEncoder.toUint8Array());
      writeVarUint8Array(encoder, this.lenEncoder.toUint8Array());
      writeUint8Array(encoder, toUint8Array(this.restEncoder));
      return toUint8Array(encoder);
    }
    /**
     * @param {ID} id
     */
    writeLeftID(id2) {
      this.clientEncoder.write(id2.client);
      this.leftClockEncoder.write(id2.clock);
    }
    /**
     * @param {ID} id
     */
    writeRightID(id2) {
      this.clientEncoder.write(id2.client);
      this.rightClockEncoder.write(id2.clock);
    }
    /**
     * @param {number} client
     */
    writeClient(client) {
      this.clientEncoder.write(client);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeInfo(info) {
      this.infoEncoder.write(info);
    }
    /**
     * @param {string} s
     */
    writeString(s) {
      this.stringEncoder.write(s);
    }
    /**
     * @param {boolean} isYKey
     */
    writeParentInfo(isYKey) {
      this.parentInfoEncoder.write(isYKey ? 1 : 0);
    }
    /**
     * @param {number} info An unsigned 8-bit integer
     */
    writeTypeRef(info) {
      this.typeRefEncoder.write(info);
    }
    /**
     * Write len of a struct - well suited for Opt RLE encoder.
     *
     * @param {number} len
     */
    writeLen(len) {
      this.lenEncoder.write(len);
    }
    /**
     * @param {any} any
     */
    writeAny(any2) {
      writeAny(this.restEncoder, any2);
    }
    /**
     * @param {Uint8Array} buf
     */
    writeBuf(buf) {
      writeVarUint8Array(this.restEncoder, buf);
    }
    /**
     * This is mainly here for legacy purposes.
     *
     * Initial we incoded objects using JSON. Now we use the much faster lib0/any-encoder. This method mainly exists for legacy purposes for the v1 encoder.
     *
     * @param {any} embed
     */
    writeJSON(embed) {
      writeAny(this.restEncoder, embed);
    }
    /**
     * Property keys are often reused. For example, in y-prosemirror the key `bold` might
     * occur very often. For a 3d application, the key `position` might occur very often.
     *
     * We cache these keys in a Map and refer to them via a unique number.
     *
     * @param {string} key
     */
    writeKey(key) {
      const clock = this.keyMap.get(key);
      if (clock === void 0) {
        this.keyClockEncoder.write(this.keyClock++);
        this.stringEncoder.write(key);
      } else {
        this.keyClockEncoder.write(clock);
      }
    }
  };
  var writeStructs = (encoder, structs, client, clock) => {
    clock = max(clock, structs[0].id.clock);
    const startNewStructs = findIndexSS(structs, clock);
    writeVarUint(encoder.restEncoder, structs.length - startNewStructs);
    encoder.writeClient(client);
    writeVarUint(encoder.restEncoder, clock);
    const firstStruct = structs[startNewStructs];
    firstStruct.write(encoder, clock - firstStruct.id.clock);
    for (let i = startNewStructs + 1; i < structs.length; i++) {
      structs[i].write(encoder, 0);
    }
  };
  var writeClientsStructs = (encoder, store, _sm) => {
    const sm = /* @__PURE__ */ new Map();
    _sm.forEach((clock, client) => {
      if (getState(store, client) > clock) {
        sm.set(client, clock);
      }
    });
    getStateVector(store).forEach((_clock, client) => {
      if (!_sm.has(client)) {
        sm.set(client, 0);
      }
    });
    writeVarUint(encoder.restEncoder, sm.size);
    from(sm.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
      writeStructs(
        encoder,
        /** @type {Array<GC|Item>} */
        store.clients.get(client),
        client,
        clock
      );
    });
  };
  var readClientsStructRefs = (decoder, doc2) => {
    const clientRefs = create();
    const numOfStateUpdates = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numOfStateUpdates; i++) {
      const numberOfStructs = readVarUint(decoder.restDecoder);
      const refs = new Array(numberOfStructs);
      const client = decoder.readClient();
      let clock = readVarUint(decoder.restDecoder);
      clientRefs.set(client, { i: 0, refs });
      for (let i2 = 0; i2 < numberOfStructs; i2++) {
        const info = decoder.readInfo();
        switch (BITS5 & info) {
          case 0: {
            const len = decoder.readLen();
            refs[i2] = new GC(createID(client, clock), len);
            clock += len;
            break;
          }
          case 10: {
            const len = readVarUint(decoder.restDecoder);
            refs[i2] = new Skip(createID(client, clock), len);
            clock += len;
            break;
          }
          default: {
            const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
            const struct = new Item(
              createID(client, clock),
              null,
              // left
              (info & BIT8) === BIT8 ? decoder.readLeftID() : null,
              // origin
              null,
              // right
              (info & BIT7) === BIT7 ? decoder.readRightID() : null,
              // right origin
              cantCopyParentInfo ? decoder.readParentInfo() ? doc2.get(decoder.readString()) : decoder.readLeftID() : null,
              // parent
              cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null,
              // parentSub
              readItemContent(decoder, info)
              // item content
            );
            refs[i2] = struct;
            clock += struct.length;
          }
        }
      }
    }
    return clientRefs;
  };
  var integrateStructs = (transaction, store, clientsStructRefs) => {
    const stack = [];
    let clientsStructRefsIds = from(clientsStructRefs.keys()).sort((a, b) => a - b);
    if (clientsStructRefsIds.length === 0) {
      return null;
    }
    const getNextStructTarget = () => {
      if (clientsStructRefsIds.length === 0) {
        return null;
      }
      let nextStructsTarget = (
        /** @type {{i:number,refs:Array<GC|Item>}} */
        clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1])
      );
      while (nextStructsTarget.refs.length === nextStructsTarget.i) {
        clientsStructRefsIds.pop();
        if (clientsStructRefsIds.length > 0) {
          nextStructsTarget = /** @type {{i:number,refs:Array<GC|Item>}} */
          clientsStructRefs.get(clientsStructRefsIds[clientsStructRefsIds.length - 1]);
        } else {
          return null;
        }
      }
      return nextStructsTarget;
    };
    let curStructsTarget = getNextStructTarget();
    if (curStructsTarget === null) {
      return null;
    }
    const restStructs = new StructStore();
    const missingSV = /* @__PURE__ */ new Map();
    const updateMissingSv = (client, clock) => {
      const mclock = missingSV.get(client);
      if (mclock == null || mclock > clock) {
        missingSV.set(client, clock);
      }
    };
    let stackHead = (
      /** @type {any} */
      curStructsTarget.refs[
        /** @type {any} */
        curStructsTarget.i++
      ]
    );
    const state = /* @__PURE__ */ new Map();
    const addStackToRestSS = () => {
      for (const item of stack) {
        const client = item.id.client;
        const inapplicableItems = clientsStructRefs.get(client);
        if (inapplicableItems) {
          inapplicableItems.i--;
          restStructs.clients.set(client, inapplicableItems.refs.slice(inapplicableItems.i));
          clientsStructRefs.delete(client);
          inapplicableItems.i = 0;
          inapplicableItems.refs = [];
        } else {
          restStructs.clients.set(client, [item]);
        }
        clientsStructRefsIds = clientsStructRefsIds.filter((c) => c !== client);
      }
      stack.length = 0;
    };
    while (true) {
      if (stackHead.constructor !== Skip) {
        const localClock = setIfUndefined(state, stackHead.id.client, () => getState(store, stackHead.id.client));
        const offset = localClock - stackHead.id.clock;
        if (offset < 0) {
          stack.push(stackHead);
          updateMissingSv(stackHead.id.client, stackHead.id.clock - 1);
          addStackToRestSS();
        } else {
          const missing = stackHead.getMissing(transaction, store);
          if (missing !== null) {
            stack.push(stackHead);
            const structRefs = clientsStructRefs.get(
              /** @type {number} */
              missing
            ) || { refs: [], i: 0 };
            if (structRefs.refs.length === structRefs.i) {
              updateMissingSv(
                /** @type {number} */
                missing,
                getState(store, missing)
              );
              addStackToRestSS();
            } else {
              stackHead = structRefs.refs[structRefs.i++];
              continue;
            }
          } else if (offset === 0 || offset < stackHead.length) {
            stackHead.integrate(transaction, offset);
            state.set(stackHead.id.client, stackHead.id.clock + stackHead.length);
          }
        }
      }
      if (stack.length > 0) {
        stackHead = /** @type {GC|Item} */
        stack.pop();
      } else if (curStructsTarget !== null && curStructsTarget.i < curStructsTarget.refs.length) {
        stackHead = /** @type {GC|Item} */
        curStructsTarget.refs[curStructsTarget.i++];
      } else {
        curStructsTarget = getNextStructTarget();
        if (curStructsTarget === null) {
          break;
        } else {
          stackHead = /** @type {GC|Item} */
          curStructsTarget.refs[curStructsTarget.i++];
        }
      }
    }
    if (restStructs.clients.size > 0) {
      const encoder = new UpdateEncoderV2();
      writeClientsStructs(encoder, restStructs, /* @__PURE__ */ new Map());
      writeVarUint(encoder.restEncoder, 0);
      return { missing: missingSV, update: encoder.toUint8Array() };
    }
    return null;
  };
  var writeStructsFromTransaction = (encoder, transaction) => writeClientsStructs(encoder, transaction.doc.store, transaction.beforeState);
  var readUpdateV2 = (decoder, ydoc, transactionOrigin, structDecoder = new UpdateDecoderV2(decoder)) => transact(ydoc, (transaction) => {
    transaction.local = false;
    let retry2 = false;
    const doc2 = transaction.doc;
    const store = doc2.store;
    const ss = readClientsStructRefs(structDecoder, doc2);
    const restStructs = integrateStructs(transaction, store, ss);
    const pending = store.pendingStructs;
    if (pending) {
      for (const [client, clock] of pending.missing) {
        if (clock < getState(store, client)) {
          retry2 = true;
          break;
        }
      }
      if (restStructs) {
        for (const [client, clock] of restStructs.missing) {
          const mclock = pending.missing.get(client);
          if (mclock == null || mclock > clock) {
            pending.missing.set(client, clock);
          }
        }
        pending.update = mergeUpdatesV2([pending.update, restStructs.update]);
      }
    } else {
      store.pendingStructs = restStructs;
    }
    const dsRest = readAndApplyDeleteSet(structDecoder, transaction, store);
    if (store.pendingDs) {
      const pendingDSUpdate = new UpdateDecoderV2(createDecoder(store.pendingDs));
      readVarUint(pendingDSUpdate.restDecoder);
      const dsRest2 = readAndApplyDeleteSet(pendingDSUpdate, transaction, store);
      if (dsRest && dsRest2) {
        store.pendingDs = mergeUpdatesV2([dsRest, dsRest2]);
      } else {
        store.pendingDs = dsRest || dsRest2;
      }
    } else {
      store.pendingDs = dsRest;
    }
    if (retry2) {
      const update = (
        /** @type {{update: Uint8Array}} */
        store.pendingStructs.update
      );
      store.pendingStructs = null;
      applyUpdateV2(transaction.doc, update);
    }
  }, transactionOrigin, false);
  var applyUpdateV2 = (ydoc, update, transactionOrigin, YDecoder = UpdateDecoderV2) => {
    const decoder = createDecoder(update);
    readUpdateV2(decoder, ydoc, transactionOrigin, new YDecoder(decoder));
  };
  var applyUpdate = (ydoc, update, transactionOrigin) => applyUpdateV2(ydoc, update, transactionOrigin, UpdateDecoderV1);
  var writeStateAsUpdate = (encoder, doc2, targetStateVector = /* @__PURE__ */ new Map()) => {
    writeClientsStructs(encoder, doc2.store, targetStateVector);
    writeDeleteSet(encoder, createDeleteSetFromStructStore(doc2.store));
  };
  var encodeStateAsUpdateV2 = (doc2, encodedTargetStateVector = new Uint8Array([0]), encoder = new UpdateEncoderV2()) => {
    const targetStateVector = decodeStateVector(encodedTargetStateVector);
    writeStateAsUpdate(encoder, doc2, targetStateVector);
    const updates = [encoder.toUint8Array()];
    if (doc2.store.pendingDs) {
      updates.push(doc2.store.pendingDs);
    }
    if (doc2.store.pendingStructs) {
      updates.push(diffUpdateV2(doc2.store.pendingStructs.update, encodedTargetStateVector));
    }
    if (updates.length > 1) {
      if (encoder.constructor === UpdateEncoderV1) {
        return mergeUpdates(updates.map((update, i) => i === 0 ? update : convertUpdateFormatV2ToV1(update)));
      } else if (encoder.constructor === UpdateEncoderV2) {
        return mergeUpdatesV2(updates);
      }
    }
    return updates[0];
  };
  var encodeStateAsUpdate = (doc2, encodedTargetStateVector) => encodeStateAsUpdateV2(doc2, encodedTargetStateVector, new UpdateEncoderV1());
  var readStateVector = (decoder) => {
    const ss = /* @__PURE__ */ new Map();
    const ssLength = readVarUint(decoder.restDecoder);
    for (let i = 0; i < ssLength; i++) {
      const client = readVarUint(decoder.restDecoder);
      const clock = readVarUint(decoder.restDecoder);
      ss.set(client, clock);
    }
    return ss;
  };
  var decodeStateVector = (decodedState) => readStateVector(new DSDecoderV1(createDecoder(decodedState)));
  var writeStateVector = (encoder, sv) => {
    writeVarUint(encoder.restEncoder, sv.size);
    from(sv.entries()).sort((a, b) => b[0] - a[0]).forEach(([client, clock]) => {
      writeVarUint(encoder.restEncoder, client);
      writeVarUint(encoder.restEncoder, clock);
    });
    return encoder;
  };
  var writeDocumentStateVector = (encoder, doc2) => writeStateVector(encoder, getStateVector(doc2.store));
  var encodeStateVectorV2 = (doc2, encoder = new DSEncoderV2()) => {
    if (doc2 instanceof Map) {
      writeStateVector(encoder, doc2);
    } else {
      writeDocumentStateVector(encoder, doc2);
    }
    return encoder.toUint8Array();
  };
  var encodeStateVector = (doc2) => encodeStateVectorV2(doc2, new DSEncoderV1());
  var EventHandler = class {
    constructor() {
      this.l = [];
    }
  };
  var createEventHandler = () => new EventHandler();
  var addEventHandlerListener = (eventHandler, f) => eventHandler.l.push(f);
  var removeEventHandlerListener = (eventHandler, f) => {
    const l = eventHandler.l;
    const len = l.length;
    eventHandler.l = l.filter((g) => f !== g);
    if (len === eventHandler.l.length) {
      console.error("[yjs] Tried to remove event handler that doesn't exist.");
    }
  };
  var callEventHandlerListeners = (eventHandler, arg0, arg1) => callAll(eventHandler.l, [arg0, arg1]);
  var ID = class {
    /**
     * @param {number} client client id
     * @param {number} clock unique per client id, continuous number
     */
    constructor(client, clock) {
      this.client = client;
      this.clock = clock;
    }
  };
  var compareIDs = (a, b) => a === b || a !== null && b !== null && a.client === b.client && a.clock === b.clock;
  var createID = (client, clock) => new ID(client, clock);
  var findRootTypeKey = (type) => {
    for (const [key, value] of type.doc.share.entries()) {
      if (value === type) {
        return key;
      }
    }
    throw unexpectedCase();
  };
  var Snapshot = class {
    /**
     * @param {DeleteSet} ds
     * @param {Map<number,number>} sv state map
     */
    constructor(ds, sv) {
      this.ds = ds;
      this.sv = sv;
    }
  };
  var createSnapshot = (ds, sm) => new Snapshot(ds, sm);
  var emptySnapshot = createSnapshot(createDeleteSet(), /* @__PURE__ */ new Map());
  var isVisible = (item, snapshot) => snapshot === void 0 ? !item.deleted : snapshot.sv.has(item.id.client) && (snapshot.sv.get(item.id.client) || 0) > item.id.clock && !isDeleted(snapshot.ds, item.id);
  var splitSnapshotAffectedStructs = (transaction, snapshot) => {
    const meta = setIfUndefined(transaction.meta, splitSnapshotAffectedStructs, create2);
    const store = transaction.doc.store;
    if (!meta.has(snapshot)) {
      snapshot.sv.forEach((clock, client) => {
        if (clock < getState(store, client)) {
          getItemCleanStart(transaction, createID(client, clock));
        }
      });
      iterateDeletedStructs(transaction, snapshot.ds, (_item) => {
      });
      meta.add(snapshot);
    }
  };
  var StructStore = class {
    constructor() {
      this.clients = /* @__PURE__ */ new Map();
      this.pendingStructs = null;
      this.pendingDs = null;
    }
  };
  var getStateVector = (store) => {
    const sm = /* @__PURE__ */ new Map();
    store.clients.forEach((structs, client) => {
      const struct = structs[structs.length - 1];
      sm.set(client, struct.id.clock + struct.length);
    });
    return sm;
  };
  var getState = (store, client) => {
    const structs = store.clients.get(client);
    if (structs === void 0) {
      return 0;
    }
    const lastStruct = structs[structs.length - 1];
    return lastStruct.id.clock + lastStruct.length;
  };
  var addStruct = (store, struct) => {
    let structs = store.clients.get(struct.id.client);
    if (structs === void 0) {
      structs = [];
      store.clients.set(struct.id.client, structs);
    } else {
      const lastStruct = structs[structs.length - 1];
      if (lastStruct.id.clock + lastStruct.length !== struct.id.clock) {
        throw unexpectedCase();
      }
    }
    structs.push(struct);
  };
  var findIndexSS = (structs, clock) => {
    let left = 0;
    let right = structs.length - 1;
    let mid = structs[right];
    let midclock = mid.id.clock;
    if (midclock === clock) {
      return right;
    }
    let midindex = floor(clock / (midclock + mid.length - 1) * right);
    while (left <= right) {
      mid = structs[midindex];
      midclock = mid.id.clock;
      if (midclock <= clock) {
        if (clock < midclock + mid.length) {
          return midindex;
        }
        left = midindex + 1;
      } else {
        right = midindex - 1;
      }
      midindex = floor((left + right) / 2);
    }
    throw unexpectedCase();
  };
  var find = (store, id2) => {
    const structs = store.clients.get(id2.client);
    return structs[findIndexSS(structs, id2.clock)];
  };
  var getItem = (
    /** @type {function(StructStore,ID):Item} */
    find
  );
  var findIndexCleanStart = (transaction, structs, clock) => {
    const index = findIndexSS(structs, clock);
    const struct = structs[index];
    if (struct.id.clock < clock && struct instanceof Item) {
      structs.splice(index + 1, 0, splitItem(transaction, struct, clock - struct.id.clock));
      return index + 1;
    }
    return index;
  };
  var getItemCleanStart = (transaction, id2) => {
    const structs = (
      /** @type {Array<Item>} */
      transaction.doc.store.clients.get(id2.client)
    );
    return structs[findIndexCleanStart(transaction, structs, id2.clock)];
  };
  var getItemCleanEnd = (transaction, store, id2) => {
    const structs = store.clients.get(id2.client);
    const index = findIndexSS(structs, id2.clock);
    const struct = structs[index];
    if (id2.clock !== struct.id.clock + struct.length - 1 && struct.constructor !== GC) {
      structs.splice(index + 1, 0, splitItem(transaction, struct, id2.clock - struct.id.clock + 1));
    }
    return struct;
  };
  var replaceStruct = (store, struct, newStruct) => {
    const structs = (
      /** @type {Array<GC|Item>} */
      store.clients.get(struct.id.client)
    );
    structs[findIndexSS(structs, struct.id.clock)] = newStruct;
  };
  var iterateStructs = (transaction, structs, clockStart, len, f) => {
    if (len === 0) {
      return;
    }
    const clockEnd = clockStart + len;
    let index = findIndexCleanStart(transaction, structs, clockStart);
    let struct;
    do {
      struct = structs[index++];
      if (clockEnd < struct.id.clock + struct.length) {
        findIndexCleanStart(transaction, structs, clockEnd);
      }
      f(struct);
    } while (index < structs.length && structs[index].id.clock < clockEnd);
  };
  var Transaction = class {
    /**
     * @param {Doc} doc
     * @param {any} origin
     * @param {boolean} local
     */
    constructor(doc2, origin, local) {
      this.doc = doc2;
      this.deleteSet = new DeleteSet();
      this.beforeState = getStateVector(doc2.store);
      this.afterState = /* @__PURE__ */ new Map();
      this.changed = /* @__PURE__ */ new Map();
      this.changedParentTypes = /* @__PURE__ */ new Map();
      this._mergeStructs = [];
      this.origin = origin;
      this.meta = /* @__PURE__ */ new Map();
      this.local = local;
      this.subdocsAdded = /* @__PURE__ */ new Set();
      this.subdocsRemoved = /* @__PURE__ */ new Set();
      this.subdocsLoaded = /* @__PURE__ */ new Set();
      this._needFormattingCleanup = false;
    }
  };
  var writeUpdateMessageFromTransaction = (encoder, transaction) => {
    if (transaction.deleteSet.clients.size === 0 && !any(transaction.afterState, (clock, client) => transaction.beforeState.get(client) !== clock)) {
      return false;
    }
    sortAndMergeDeleteSet(transaction.deleteSet);
    writeStructsFromTransaction(encoder, transaction);
    writeDeleteSet(encoder, transaction.deleteSet);
    return true;
  };
  var addChangedTypeToTransaction = (transaction, type, parentSub) => {
    const item = type._item;
    if (item === null || item.id.clock < (transaction.beforeState.get(item.id.client) || 0) && !item.deleted) {
      setIfUndefined(transaction.changed, type, create2).add(parentSub);
    }
  };
  var tryToMergeWithLefts = (structs, pos) => {
    let right = structs[pos];
    let left = structs[pos - 1];
    let i = pos;
    for (; i > 0; right = left, left = structs[--i - 1]) {
      if (left.deleted === right.deleted && left.constructor === right.constructor) {
        if (left.mergeWith(right)) {
          if (right instanceof Item && right.parentSub !== null && /** @type {AbstractType<any>} */
          right.parent._map.get(right.parentSub) === right) {
            right.parent._map.set(
              right.parentSub,
              /** @type {Item} */
              left
            );
          }
          continue;
        }
      }
      break;
    }
    const merged = pos - i;
    if (merged) {
      structs.splice(pos + 1 - merged, merged);
    }
    return merged;
  };
  var tryGcDeleteSet = (ds, store, gcFilter) => {
    for (const [client, deleteItems] of ds.clients.entries()) {
      const structs = (
        /** @type {Array<GC|Item>} */
        store.clients.get(client)
      );
      for (let di = deleteItems.length - 1; di >= 0; di--) {
        const deleteItem = deleteItems[di];
        const endDeleteItemClock = deleteItem.clock + deleteItem.len;
        for (let si = findIndexSS(structs, deleteItem.clock), struct = structs[si]; si < structs.length && struct.id.clock < endDeleteItemClock; struct = structs[++si]) {
          const struct2 = structs[si];
          if (deleteItem.clock + deleteItem.len <= struct2.id.clock) {
            break;
          }
          if (struct2 instanceof Item && struct2.deleted && !struct2.keep && gcFilter(struct2)) {
            struct2.gc(store, false);
          }
        }
      }
    }
  };
  var tryMergeDeleteSet = (ds, store) => {
    ds.clients.forEach((deleteItems, client) => {
      const structs = (
        /** @type {Array<GC|Item>} */
        store.clients.get(client)
      );
      for (let di = deleteItems.length - 1; di >= 0; di--) {
        const deleteItem = deleteItems[di];
        const mostRightIndexToCheck = min(structs.length - 1, 1 + findIndexSS(structs, deleteItem.clock + deleteItem.len - 1));
        for (let si = mostRightIndexToCheck, struct = structs[si]; si > 0 && struct.id.clock >= deleteItem.clock; struct = structs[si]) {
          si -= 1 + tryToMergeWithLefts(structs, si);
        }
      }
    });
  };
  var cleanupTransactions = (transactionCleanups, i) => {
    if (i < transactionCleanups.length) {
      const transaction = transactionCleanups[i];
      const doc2 = transaction.doc;
      const store = doc2.store;
      const ds = transaction.deleteSet;
      const mergeStructs = transaction._mergeStructs;
      try {
        sortAndMergeDeleteSet(ds);
        transaction.afterState = getStateVector(transaction.doc.store);
        doc2.emit("beforeObserverCalls", [transaction, doc2]);
        const fs = [];
        transaction.changed.forEach(
          (subs, itemtype) => fs.push(() => {
            if (itemtype._item === null || !itemtype._item.deleted) {
              itemtype._callObserver(transaction, subs);
            }
          })
        );
        fs.push(() => {
          transaction.changedParentTypes.forEach((events, type) => {
            if (type._dEH.l.length > 0 && (type._item === null || !type._item.deleted)) {
              events = events.filter(
                (event) => event.target._item === null || !event.target._item.deleted
              );
              events.forEach((event) => {
                event.currentTarget = type;
                event._path = null;
              });
              events.sort((event1, event2) => event1.path.length - event2.path.length);
              fs.push(() => {
                callEventHandlerListeners(type._dEH, events, transaction);
              });
            }
          });
          fs.push(() => doc2.emit("afterTransaction", [transaction, doc2]));
          fs.push(() => {
            if (transaction._needFormattingCleanup) {
              cleanupYTextAfterTransaction(transaction);
            }
          });
        });
        callAll(fs, []);
      } finally {
        if (doc2.gc) {
          tryGcDeleteSet(ds, store, doc2.gcFilter);
        }
        tryMergeDeleteSet(ds, store);
        transaction.afterState.forEach((clock, client) => {
          const beforeClock = transaction.beforeState.get(client) || 0;
          if (beforeClock !== clock) {
            const structs = (
              /** @type {Array<GC|Item>} */
              store.clients.get(client)
            );
            const firstChangePos = max(findIndexSS(structs, beforeClock), 1);
            for (let i2 = structs.length - 1; i2 >= firstChangePos; ) {
              i2 -= 1 + tryToMergeWithLefts(structs, i2);
            }
          }
        });
        for (let i2 = mergeStructs.length - 1; i2 >= 0; i2--) {
          const { client, clock } = mergeStructs[i2].id;
          const structs = (
            /** @type {Array<GC|Item>} */
            store.clients.get(client)
          );
          const replacedStructPos = findIndexSS(structs, clock);
          if (replacedStructPos + 1 < structs.length) {
            if (tryToMergeWithLefts(structs, replacedStructPos + 1) > 1) {
              continue;
            }
          }
          if (replacedStructPos > 0) {
            tryToMergeWithLefts(structs, replacedStructPos);
          }
        }
        if (!transaction.local && transaction.afterState.get(doc2.clientID) !== transaction.beforeState.get(doc2.clientID)) {
          print(ORANGE, BOLD, "[yjs] ", UNBOLD, RED, "Changed the client-id because another client seems to be using it.");
          doc2.clientID = generateNewClientId();
        }
        doc2.emit("afterTransactionCleanup", [transaction, doc2]);
        if (doc2._observers.has("update")) {
          const encoder = new UpdateEncoderV1();
          const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
          if (hasContent2) {
            doc2.emit("update", [encoder.toUint8Array(), transaction.origin, doc2, transaction]);
          }
        }
        if (doc2._observers.has("updateV2")) {
          const encoder = new UpdateEncoderV2();
          const hasContent2 = writeUpdateMessageFromTransaction(encoder, transaction);
          if (hasContent2) {
            doc2.emit("updateV2", [encoder.toUint8Array(), transaction.origin, doc2, transaction]);
          }
        }
        const { subdocsAdded, subdocsLoaded, subdocsRemoved } = transaction;
        if (subdocsAdded.size > 0 || subdocsRemoved.size > 0 || subdocsLoaded.size > 0) {
          subdocsAdded.forEach((subdoc) => {
            subdoc.clientID = doc2.clientID;
            if (subdoc.collectionid == null) {
              subdoc.collectionid = doc2.collectionid;
            }
            doc2.subdocs.add(subdoc);
          });
          subdocsRemoved.forEach((subdoc) => doc2.subdocs.delete(subdoc));
          doc2.emit("subdocs", [{ loaded: subdocsLoaded, added: subdocsAdded, removed: subdocsRemoved }, doc2, transaction]);
          subdocsRemoved.forEach((subdoc) => subdoc.destroy());
        }
        if (transactionCleanups.length <= i + 1) {
          doc2._transactionCleanups = [];
          doc2.emit("afterAllTransactions", [doc2, transactionCleanups]);
        } else {
          cleanupTransactions(transactionCleanups, i + 1);
        }
      }
    }
  };
  var transact = (doc2, f, origin = null, local = true) => {
    const transactionCleanups = doc2._transactionCleanups;
    let initialCall = false;
    let result = null;
    if (doc2._transaction === null) {
      initialCall = true;
      doc2._transaction = new Transaction(doc2, origin, local);
      transactionCleanups.push(doc2._transaction);
      if (transactionCleanups.length === 1) {
        doc2.emit("beforeAllTransactions", [doc2]);
      }
      doc2.emit("beforeTransaction", [doc2._transaction, doc2]);
    }
    try {
      result = f(doc2._transaction);
    } finally {
      if (initialCall) {
        const finishCleanup = doc2._transaction === transactionCleanups[0];
        doc2._transaction = null;
        if (finishCleanup) {
          cleanupTransactions(transactionCleanups, 0);
        }
      }
    }
    return result;
  };
  function* lazyStructReaderGenerator(decoder) {
    const numOfStateUpdates = readVarUint(decoder.restDecoder);
    for (let i = 0; i < numOfStateUpdates; i++) {
      const numberOfStructs = readVarUint(decoder.restDecoder);
      const client = decoder.readClient();
      let clock = readVarUint(decoder.restDecoder);
      for (let i2 = 0; i2 < numberOfStructs; i2++) {
        const info = decoder.readInfo();
        if (info === 10) {
          const len = readVarUint(decoder.restDecoder);
          yield new Skip(createID(client, clock), len);
          clock += len;
        } else if ((BITS5 & info) !== 0) {
          const cantCopyParentInfo = (info & (BIT7 | BIT8)) === 0;
          const struct = new Item(
            createID(client, clock),
            null,
            // left
            (info & BIT8) === BIT8 ? decoder.readLeftID() : null,
            // origin
            null,
            // right
            (info & BIT7) === BIT7 ? decoder.readRightID() : null,
            // right origin
            // @ts-ignore Force writing a string here.
            cantCopyParentInfo ? decoder.readParentInfo() ? decoder.readString() : decoder.readLeftID() : null,
            // parent
            cantCopyParentInfo && (info & BIT6) === BIT6 ? decoder.readString() : null,
            // parentSub
            readItemContent(decoder, info)
            // item content
          );
          yield struct;
          clock += struct.length;
        } else {
          const len = decoder.readLen();
          yield new GC(createID(client, clock), len);
          clock += len;
        }
      }
    }
  }
  var LazyStructReader = class {
    /**
     * @param {UpdateDecoderV1 | UpdateDecoderV2} decoder
     * @param {boolean} filterSkips
     */
    constructor(decoder, filterSkips) {
      this.gen = lazyStructReaderGenerator(decoder);
      this.curr = null;
      this.done = false;
      this.filterSkips = filterSkips;
      this.next();
    }
    /**
     * @return {Item | GC | Skip |null}
     */
    next() {
      do {
        this.curr = this.gen.next().value || null;
      } while (this.filterSkips && this.curr !== null && this.curr.constructor === Skip);
      return this.curr;
    }
  };
  var LazyStructWriter = class {
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    constructor(encoder) {
      this.currClient = 0;
      this.startClock = 0;
      this.written = 0;
      this.encoder = encoder;
      this.clientStructs = [];
    }
  };
  var mergeUpdates = (updates) => mergeUpdatesV2(updates, UpdateDecoderV1, UpdateEncoderV1);
  var sliceStruct = (left, diff) => {
    if (left.constructor === GC) {
      const { client, clock } = left.id;
      return new GC(createID(client, clock + diff), left.length - diff);
    } else if (left.constructor === Skip) {
      const { client, clock } = left.id;
      return new Skip(createID(client, clock + diff), left.length - diff);
    } else {
      const leftItem = (
        /** @type {Item} */
        left
      );
      const { client, clock } = leftItem.id;
      return new Item(
        createID(client, clock + diff),
        null,
        createID(client, clock + diff - 1),
        null,
        leftItem.rightOrigin,
        leftItem.parent,
        leftItem.parentSub,
        leftItem.content.splice(diff)
      );
    }
  };
  var mergeUpdatesV2 = (updates, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
    if (updates.length === 1) {
      return updates[0];
    }
    const updateDecoders = updates.map((update) => new YDecoder(createDecoder(update)));
    let lazyStructDecoders = updateDecoders.map((decoder) => new LazyStructReader(decoder, true));
    let currWrite = null;
    const updateEncoder = new YEncoder();
    const lazyStructEncoder = new LazyStructWriter(updateEncoder);
    while (true) {
      lazyStructDecoders = lazyStructDecoders.filter((dec) => dec.curr !== null);
      lazyStructDecoders.sort(
        /** @type {function(any,any):number} */
        (dec1, dec2) => {
          if (dec1.curr.id.client === dec2.curr.id.client) {
            const clockDiff = dec1.curr.id.clock - dec2.curr.id.clock;
            if (clockDiff === 0) {
              return dec1.curr.constructor === dec2.curr.constructor ? 0 : dec1.curr.constructor === Skip ? 1 : -1;
            } else {
              return clockDiff;
            }
          } else {
            return dec2.curr.id.client - dec1.curr.id.client;
          }
        }
      );
      if (lazyStructDecoders.length === 0) {
        break;
      }
      const currDecoder = lazyStructDecoders[0];
      const firstClient = (
        /** @type {Item | GC} */
        currDecoder.curr.id.client
      );
      if (currWrite !== null) {
        let curr = (
          /** @type {Item | GC | null} */
          currDecoder.curr
        );
        let iterated = false;
        while (curr !== null && curr.id.clock + curr.length <= currWrite.struct.id.clock + currWrite.struct.length && curr.id.client >= currWrite.struct.id.client) {
          curr = currDecoder.next();
          iterated = true;
        }
        if (curr === null || // current decoder is empty
        curr.id.client !== firstClient || // check whether there is another decoder that has has updates from `firstClient`
        iterated && curr.id.clock > currWrite.struct.id.clock + currWrite.struct.length) {
          continue;
        }
        if (firstClient !== currWrite.struct.id.client) {
          writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
          currWrite = { struct: curr, offset: 0 };
          currDecoder.next();
        } else {
          if (currWrite.struct.id.clock + currWrite.struct.length < curr.id.clock) {
            if (currWrite.struct.constructor === Skip) {
              currWrite.struct.length = curr.id.clock + curr.length - currWrite.struct.id.clock;
            } else {
              writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
              const diff = curr.id.clock - currWrite.struct.id.clock - currWrite.struct.length;
              const struct = new Skip(createID(firstClient, currWrite.struct.id.clock + currWrite.struct.length), diff);
              currWrite = { struct, offset: 0 };
            }
          } else {
            const diff = currWrite.struct.id.clock + currWrite.struct.length - curr.id.clock;
            if (diff > 0) {
              if (currWrite.struct.constructor === Skip) {
                currWrite.struct.length -= diff;
              } else {
                curr = sliceStruct(curr, diff);
              }
            }
            if (!currWrite.struct.mergeWith(
              /** @type {any} */
              curr
            )) {
              writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
              currWrite = { struct: curr, offset: 0 };
              currDecoder.next();
            }
          }
        }
      } else {
        currWrite = { struct: (
          /** @type {Item | GC} */
          currDecoder.curr
        ), offset: 0 };
        currDecoder.next();
      }
      for (let next = currDecoder.curr; next !== null && next.id.client === firstClient && next.id.clock === currWrite.struct.id.clock + currWrite.struct.length && next.constructor !== Skip; next = currDecoder.next()) {
        writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
        currWrite = { struct: next, offset: 0 };
      }
    }
    if (currWrite !== null) {
      writeStructToLazyStructWriter(lazyStructEncoder, currWrite.struct, currWrite.offset);
      currWrite = null;
    }
    finishLazyStructWriting(lazyStructEncoder);
    const dss = updateDecoders.map((decoder) => readDeleteSet(decoder));
    const ds = mergeDeleteSets(dss);
    writeDeleteSet(updateEncoder, ds);
    return updateEncoder.toUint8Array();
  };
  var diffUpdateV2 = (update, sv, YDecoder = UpdateDecoderV2, YEncoder = UpdateEncoderV2) => {
    const state = decodeStateVector(sv);
    const encoder = new YEncoder();
    const lazyStructWriter = new LazyStructWriter(encoder);
    const decoder = new YDecoder(createDecoder(update));
    const reader = new LazyStructReader(decoder, false);
    while (reader.curr) {
      const curr = reader.curr;
      const currClient = curr.id.client;
      const svClock = state.get(currClient) || 0;
      if (reader.curr.constructor === Skip) {
        reader.next();
        continue;
      }
      if (curr.id.clock + curr.length > svClock) {
        writeStructToLazyStructWriter(lazyStructWriter, curr, max(svClock - curr.id.clock, 0));
        reader.next();
        while (reader.curr && reader.curr.id.client === currClient) {
          writeStructToLazyStructWriter(lazyStructWriter, reader.curr, 0);
          reader.next();
        }
      } else {
        while (reader.curr && reader.curr.id.client === currClient && reader.curr.id.clock + reader.curr.length <= svClock) {
          reader.next();
        }
      }
    }
    finishLazyStructWriting(lazyStructWriter);
    const ds = readDeleteSet(decoder);
    writeDeleteSet(encoder, ds);
    return encoder.toUint8Array();
  };
  var flushLazyStructWriter = (lazyWriter) => {
    if (lazyWriter.written > 0) {
      lazyWriter.clientStructs.push({ written: lazyWriter.written, restEncoder: toUint8Array(lazyWriter.encoder.restEncoder) });
      lazyWriter.encoder.restEncoder = createEncoder();
      lazyWriter.written = 0;
    }
  };
  var writeStructToLazyStructWriter = (lazyWriter, struct, offset) => {
    if (lazyWriter.written > 0 && lazyWriter.currClient !== struct.id.client) {
      flushLazyStructWriter(lazyWriter);
    }
    if (lazyWriter.written === 0) {
      lazyWriter.currClient = struct.id.client;
      lazyWriter.encoder.writeClient(struct.id.client);
      writeVarUint(lazyWriter.encoder.restEncoder, struct.id.clock + offset);
    }
    struct.write(lazyWriter.encoder, offset);
    lazyWriter.written++;
  };
  var finishLazyStructWriting = (lazyWriter) => {
    flushLazyStructWriter(lazyWriter);
    const restEncoder = lazyWriter.encoder.restEncoder;
    writeVarUint(restEncoder, lazyWriter.clientStructs.length);
    for (let i = 0; i < lazyWriter.clientStructs.length; i++) {
      const partStructs = lazyWriter.clientStructs[i];
      writeVarUint(restEncoder, partStructs.written);
      writeUint8Array(restEncoder, partStructs.restEncoder);
    }
  };
  var convertUpdateFormat = (update, blockTransformer, YDecoder, YEncoder) => {
    const updateDecoder = new YDecoder(createDecoder(update));
    const lazyDecoder = new LazyStructReader(updateDecoder, false);
    const updateEncoder = new YEncoder();
    const lazyWriter = new LazyStructWriter(updateEncoder);
    for (let curr = lazyDecoder.curr; curr !== null; curr = lazyDecoder.next()) {
      writeStructToLazyStructWriter(lazyWriter, blockTransformer(curr), 0);
    }
    finishLazyStructWriting(lazyWriter);
    const ds = readDeleteSet(updateDecoder);
    writeDeleteSet(updateEncoder, ds);
    return updateEncoder.toUint8Array();
  };
  var convertUpdateFormatV2ToV1 = (update) => convertUpdateFormat(update, id, UpdateDecoderV2, UpdateEncoderV1);
  var errorComputeChanges = "You must not compute changes after the event-handler fired.";
  var YEvent = class {
    /**
     * @param {T} target The changed type.
     * @param {Transaction} transaction
     */
    constructor(target, transaction) {
      this.target = target;
      this.currentTarget = target;
      this.transaction = transaction;
      this._changes = null;
      this._keys = null;
      this._delta = null;
      this._path = null;
    }
    /**
     * Computes the path from `y` to the changed type.
     *
     * @todo v14 should standardize on path: Array<{parent, index}> because that is easier to work with.
     *
     * The following property holds:
     * @example
     *   let type = y
     *   event.path.forEach(dir => {
     *     type = type.get(dir)
     *   })
     *   type === event.target // => true
     */
    get path() {
      return this._path || (this._path = getPathTo(this.currentTarget, this.target));
    }
    /**
     * Check if a struct is deleted by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    deletes(struct) {
      return isDeleted(this.transaction.deleteSet, struct.id);
    }
    /**
     * @type {Map<string, { action: 'add' | 'update' | 'delete', oldValue: any }>}
     */
    get keys() {
      if (this._keys === null) {
        if (this.transaction.doc._transactionCleanups.length === 0) {
          throw create3(errorComputeChanges);
        }
        const keys3 = /* @__PURE__ */ new Map();
        const target = this.target;
        const changed = (
          /** @type Set<string|null> */
          this.transaction.changed.get(target)
        );
        changed.forEach((key) => {
          if (key !== null) {
            const item = (
              /** @type {Item} */
              target._map.get(key)
            );
            let action;
            let oldValue;
            if (this.adds(item)) {
              let prev = item.left;
              while (prev !== null && this.adds(prev)) {
                prev = prev.left;
              }
              if (this.deletes(item)) {
                if (prev !== null && this.deletes(prev)) {
                  action = "delete";
                  oldValue = last(prev.content.getContent());
                } else {
                  return;
                }
              } else {
                if (prev !== null && this.deletes(prev)) {
                  action = "update";
                  oldValue = last(prev.content.getContent());
                } else {
                  action = "add";
                  oldValue = void 0;
                }
              }
            } else {
              if (this.deletes(item)) {
                action = "delete";
                oldValue = last(
                  /** @type {Item} */
                  item.content.getContent()
                );
              } else {
                return;
              }
            }
            keys3.set(key, { action, oldValue });
          }
        });
        this._keys = keys3;
      }
      return this._keys;
    }
    /**
     * This is a computed property. Note that this can only be safely computed during the
     * event call. Computing this property after other changes happened might result in
     * unexpected behavior (incorrect computation of deltas). A safe way to collect changes
     * is to store the `changes` or the `delta` object. Avoid storing the `transaction` object.
     *
     * @type {Array<{insert?: string | Array<any> | object | AbstractType<any>, retain?: number, delete?: number, attributes?: Object<string, any>}>}
     */
    get delta() {
      return this.changes.delta;
    }
    /**
     * Check if a struct is added by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    adds(struct) {
      return struct.id.clock >= (this.transaction.beforeState.get(struct.id.client) || 0);
    }
    /**
     * This is a computed property. Note that this can only be safely computed during the
     * event call. Computing this property after other changes happened might result in
     * unexpected behavior (incorrect computation of deltas). A safe way to collect changes
     * is to store the `changes` or the `delta` object. Avoid storing the `transaction` object.
     *
     * @type {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert?:Array<any>|string, delete?:number, retain?:number}>}}
     */
    get changes() {
      let changes = this._changes;
      if (changes === null) {
        if (this.transaction.doc._transactionCleanups.length === 0) {
          throw create3(errorComputeChanges);
        }
        const target = this.target;
        const added = create2();
        const deleted = create2();
        const delta = [];
        changes = {
          added,
          deleted,
          delta,
          keys: this.keys
        };
        const changed = (
          /** @type Set<string|null> */
          this.transaction.changed.get(target)
        );
        if (changed.has(null)) {
          let lastOp = null;
          const packOp = () => {
            if (lastOp) {
              delta.push(lastOp);
            }
          };
          for (let item = target._start; item !== null; item = item.right) {
            if (item.deleted) {
              if (this.deletes(item) && !this.adds(item)) {
                if (lastOp === null || lastOp.delete === void 0) {
                  packOp();
                  lastOp = { delete: 0 };
                }
                lastOp.delete += item.length;
                deleted.add(item);
              }
            } else {
              if (this.adds(item)) {
                if (lastOp === null || lastOp.insert === void 0) {
                  packOp();
                  lastOp = { insert: [] };
                }
                lastOp.insert = lastOp.insert.concat(item.content.getContent());
                added.add(item);
              } else {
                if (lastOp === null || lastOp.retain === void 0) {
                  packOp();
                  lastOp = { retain: 0 };
                }
                lastOp.retain += item.length;
              }
            }
          }
          if (lastOp !== null && lastOp.retain === void 0) {
            packOp();
          }
        }
        this._changes = changes;
      }
      return (
        /** @type {any} */
        changes
      );
    }
  };
  var getPathTo = (parent, child) => {
    const path = [];
    while (child._item !== null && child !== parent) {
      if (child._item.parentSub !== null) {
        path.unshift(child._item.parentSub);
      } else {
        let i = 0;
        let c = (
          /** @type {AbstractType<any>} */
          child._item.parent._start
        );
        while (c !== child._item && c !== null) {
          if (!c.deleted && c.countable) {
            i += c.length;
          }
          c = c.right;
        }
        path.unshift(i);
      }
      child = /** @type {AbstractType<any>} */
      child._item.parent;
    }
    return path;
  };
  var warnPrematureAccess = () => {
    warn("Invalid access: Add Yjs type to a document before reading data.");
  };
  var maxSearchMarker = 80;
  var globalSearchMarkerTimestamp = 0;
  var ArraySearchMarker = class {
    /**
     * @param {Item} p
     * @param {number} index
     */
    constructor(p, index) {
      p.marker = true;
      this.p = p;
      this.index = index;
      this.timestamp = globalSearchMarkerTimestamp++;
    }
  };
  var refreshMarkerTimestamp = (marker) => {
    marker.timestamp = globalSearchMarkerTimestamp++;
  };
  var overwriteMarker = (marker, p, index) => {
    marker.p.marker = false;
    marker.p = p;
    p.marker = true;
    marker.index = index;
    marker.timestamp = globalSearchMarkerTimestamp++;
  };
  var markPosition = (searchMarker, p, index) => {
    if (searchMarker.length >= maxSearchMarker) {
      const marker = searchMarker.reduce((a, b) => a.timestamp < b.timestamp ? a : b);
      overwriteMarker(marker, p, index);
      return marker;
    } else {
      const pm = new ArraySearchMarker(p, index);
      searchMarker.push(pm);
      return pm;
    }
  };
  var findMarker = (yarray, index) => {
    if (yarray._start === null || index === 0 || yarray._searchMarker === null) {
      return null;
    }
    const marker = yarray._searchMarker.length === 0 ? null : yarray._searchMarker.reduce((a, b) => abs(index - a.index) < abs(index - b.index) ? a : b);
    let p = yarray._start;
    let pindex = 0;
    if (marker !== null) {
      p = marker.p;
      pindex = marker.index;
      refreshMarkerTimestamp(marker);
    }
    while (p.right !== null && pindex < index) {
      if (!p.deleted && p.countable) {
        if (index < pindex + p.length) {
          break;
        }
        pindex += p.length;
      }
      p = p.right;
    }
    while (p.left !== null && pindex > index) {
      p = p.left;
      if (!p.deleted && p.countable) {
        pindex -= p.length;
      }
    }
    while (p.left !== null && p.left.id.client === p.id.client && p.left.id.clock + p.left.length === p.id.clock) {
      p = p.left;
      if (!p.deleted && p.countable) {
        pindex -= p.length;
      }
    }
    if (marker !== null && abs(marker.index - pindex) < /** @type {YText|YArray<any>} */
    p.parent.length / maxSearchMarker) {
      overwriteMarker(marker, p, pindex);
      return marker;
    } else {
      return markPosition(yarray._searchMarker, p, pindex);
    }
  };
  var updateMarkerChanges = (searchMarker, index, len) => {
    for (let i = searchMarker.length - 1; i >= 0; i--) {
      const m = searchMarker[i];
      if (len > 0) {
        let p = m.p;
        p.marker = false;
        while (p && (p.deleted || !p.countable)) {
          p = p.left;
          if (p && !p.deleted && p.countable) {
            m.index -= p.length;
          }
        }
        if (p === null || p.marker === true) {
          searchMarker.splice(i, 1);
          continue;
        }
        m.p = p;
        p.marker = true;
      }
      if (index < m.index || len > 0 && index === m.index) {
        m.index = max(index, m.index + len);
      }
    }
  };
  var callTypeObservers = (type, transaction, event) => {
    const changedType = type;
    const changedParentTypes = transaction.changedParentTypes;
    while (true) {
      setIfUndefined(changedParentTypes, type, () => []).push(event);
      if (type._item === null) {
        break;
      }
      type = /** @type {AbstractType<any>} */
      type._item.parent;
    }
    callEventHandlerListeners(changedType._eH, event, transaction);
  };
  var AbstractType = class {
    constructor() {
      this._item = null;
      this._map = /* @__PURE__ */ new Map();
      this._start = null;
      this.doc = null;
      this._length = 0;
      this._eH = createEventHandler();
      this._dEH = createEventHandler();
      this._searchMarker = null;
    }
    /**
     * @return {AbstractType<any>|null}
     */
    get parent() {
      return this._item ? (
        /** @type {AbstractType<any>} */
        this._item.parent
      ) : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item|null} item
     */
    _integrate(y, item) {
      this.doc = y;
      this._item = item;
    }
    /**
     * @return {AbstractType<EventType>}
     */
    _copy() {
      throw methodUnimplemented();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {AbstractType<EventType>}
     */
    clone() {
      throw methodUnimplemented();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} _encoder
     */
    _write(_encoder) {
    }
    /**
     * The first non-deleted item
     */
    get _first() {
      let n = this._start;
      while (n !== null && n.deleted) {
        n = n.right;
      }
      return n;
    }
    /**
     * Creates YEvent and calls all type observers.
     * Must be implemented by each type.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} _parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, _parentSubs) {
      if (!transaction.local && this._searchMarker) {
        this._searchMarker.length = 0;
      }
    }
    /**
     * Observe all events that are created on this type.
     *
     * @param {function(EventType, Transaction):void} f Observer function
     */
    observe(f) {
      addEventHandlerListener(this._eH, f);
    }
    /**
     * Observe all events that are created by this type and its children.
     *
     * @param {function(Array<YEvent<any>>,Transaction):void} f Observer function
     */
    observeDeep(f) {
      addEventHandlerListener(this._dEH, f);
    }
    /**
     * Unregister an observer function.
     *
     * @param {function(EventType,Transaction):void} f Observer function
     */
    unobserve(f) {
      removeEventHandlerListener(this._eH, f);
    }
    /**
     * Unregister an observer function.
     *
     * @param {function(Array<YEvent<any>>,Transaction):void} f Observer function
     */
    unobserveDeep(f) {
      removeEventHandlerListener(this._dEH, f);
    }
    /**
     * @abstract
     * @return {any}
     */
    toJSON() {
    }
  };
  var typeListSlice = (type, start, end) => {
    type.doc ?? warnPrematureAccess();
    if (start < 0) {
      start = type._length + start;
    }
    if (end < 0) {
      end = type._length + end;
    }
    let len = end - start;
    const cs = [];
    let n = type._start;
    while (n !== null && len > 0) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        if (c.length <= start) {
          start -= c.length;
        } else {
          for (let i = start; i < c.length && len > 0; i++) {
            cs.push(c[i]);
            len--;
          }
          start = 0;
        }
      }
      n = n.right;
    }
    return cs;
  };
  var typeListToArray = (type) => {
    type.doc ?? warnPrematureAccess();
    const cs = [];
    let n = type._start;
    while (n !== null) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        for (let i = 0; i < c.length; i++) {
          cs.push(c[i]);
        }
      }
      n = n.right;
    }
    return cs;
  };
  var typeListForEach = (type, f) => {
    let index = 0;
    let n = type._start;
    type.doc ?? warnPrematureAccess();
    while (n !== null) {
      if (n.countable && !n.deleted) {
        const c = n.content.getContent();
        for (let i = 0; i < c.length; i++) {
          f(c[i], index++, type);
        }
      }
      n = n.right;
    }
  };
  var typeListMap = (type, f) => {
    const result = [];
    typeListForEach(type, (c, i) => {
      result.push(f(c, i, type));
    });
    return result;
  };
  var typeListCreateIterator = (type) => {
    let n = type._start;
    let currentContent = null;
    let currentContentIndex = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: () => {
        if (currentContent === null) {
          while (n !== null && n.deleted) {
            n = n.right;
          }
          if (n === null) {
            return {
              done: true,
              value: void 0
            };
          }
          currentContent = n.content.getContent();
          currentContentIndex = 0;
          n = n.right;
        }
        const value = currentContent[currentContentIndex++];
        if (currentContent.length <= currentContentIndex) {
          currentContent = null;
        }
        return {
          done: false,
          value
        };
      }
    };
  };
  var typeListGet = (type, index) => {
    type.doc ?? warnPrematureAccess();
    const marker = findMarker(type, index);
    let n = type._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
    }
    for (; n !== null; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index < n.length) {
          return n.content.getContent()[index];
        }
        index -= n.length;
      }
    }
  };
  var typeListInsertGenericsAfter = (transaction, parent, referenceItem, content) => {
    let left = referenceItem;
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    const store = doc2.store;
    const right = referenceItem === null ? parent._start : referenceItem.right;
    let jsonContent = [];
    const packJsonContent = () => {
      if (jsonContent.length > 0) {
        left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentAny(jsonContent));
        left.integrate(transaction, 0);
        jsonContent = [];
      }
    };
    content.forEach((c) => {
      if (c === null) {
        jsonContent.push(c);
      } else {
        switch (c.constructor) {
          case Number:
          case Object:
          case Boolean:
          case Array:
          case String:
            jsonContent.push(c);
            break;
          default:
            packJsonContent();
            switch (c.constructor) {
              case Uint8Array:
              case ArrayBuffer:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentBinary(new Uint8Array(
                  /** @type {Uint8Array} */
                  c
                )));
                left.integrate(transaction, 0);
                break;
              case Doc:
                left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentDoc(
                  /** @type {Doc} */
                  c
                ));
                left.integrate(transaction, 0);
                break;
              default:
                if (c instanceof AbstractType) {
                  left = new Item(createID(ownClientId, getState(store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentType(c));
                  left.integrate(transaction, 0);
                } else {
                  throw new Error("Unexpected content type in insert operation");
                }
            }
        }
      }
    });
    packJsonContent();
  };
  var lengthExceeded = () => create3("Length exceeded!");
  var typeListInsertGenerics = (transaction, parent, index, content) => {
    if (index > parent._length) {
      throw lengthExceeded();
    }
    if (index === 0) {
      if (parent._searchMarker) {
        updateMarkerChanges(parent._searchMarker, index, content.length);
      }
      return typeListInsertGenericsAfter(transaction, parent, null, content);
    }
    const startIndex = index;
    const marker = findMarker(parent, index);
    let n = parent._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
      if (index === 0) {
        n = n.prev;
        index += n && n.countable && !n.deleted ? n.length : 0;
      }
    }
    for (; n !== null; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index <= n.length) {
          if (index < n.length) {
            getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
          }
          break;
        }
        index -= n.length;
      }
    }
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, startIndex, content.length);
    }
    return typeListInsertGenericsAfter(transaction, parent, n, content);
  };
  var typeListPushGenerics = (transaction, parent, content) => {
    const marker = (parent._searchMarker || []).reduce((maxMarker, currMarker) => currMarker.index > maxMarker.index ? currMarker : maxMarker, { index: 0, p: parent._start });
    let n = marker.p;
    if (n) {
      while (n.right) {
        n = n.right;
      }
    }
    return typeListInsertGenericsAfter(transaction, parent, n, content);
  };
  var typeListDelete = (transaction, parent, index, length3) => {
    if (length3 === 0) {
      return;
    }
    const startIndex = index;
    const startLength = length3;
    const marker = findMarker(parent, index);
    let n = parent._start;
    if (marker !== null) {
      n = marker.p;
      index -= marker.index;
    }
    for (; n !== null && index > 0; n = n.right) {
      if (!n.deleted && n.countable) {
        if (index < n.length) {
          getItemCleanStart(transaction, createID(n.id.client, n.id.clock + index));
        }
        index -= n.length;
      }
    }
    while (length3 > 0 && n !== null) {
      if (!n.deleted) {
        if (length3 < n.length) {
          getItemCleanStart(transaction, createID(n.id.client, n.id.clock + length3));
        }
        n.delete(transaction);
        length3 -= n.length;
      }
      n = n.right;
    }
    if (length3 > 0) {
      throw lengthExceeded();
    }
    if (parent._searchMarker) {
      updateMarkerChanges(
        parent._searchMarker,
        startIndex,
        -startLength + length3
        /* in case we remove the above exception */
      );
    }
  };
  var typeMapDelete = (transaction, parent, key) => {
    const c = parent._map.get(key);
    if (c !== void 0) {
      c.delete(transaction);
    }
  };
  var typeMapSet = (transaction, parent, key, value) => {
    const left = parent._map.get(key) || null;
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    let content;
    if (value == null) {
      content = new ContentAny([value]);
    } else {
      switch (value.constructor) {
        case Number:
        case Object:
        case Boolean:
        case Array:
        case String:
        case Date:
        case BigInt:
          content = new ContentAny([value]);
          break;
        case Uint8Array:
          content = new ContentBinary(
            /** @type {Uint8Array} */
            value
          );
          break;
        case Doc:
          content = new ContentDoc(
            /** @type {Doc} */
            value
          );
          break;
        default:
          if (value instanceof AbstractType) {
            content = new ContentType(value);
          } else {
            throw new Error("Unexpected content type");
          }
      }
    }
    new Item(createID(ownClientId, getState(doc2.store, ownClientId)), left, left && left.lastId, null, null, parent, key, content).integrate(transaction, 0);
  };
  var typeMapGet = (parent, key) => {
    parent.doc ?? warnPrematureAccess();
    const val = parent._map.get(key);
    return val !== void 0 && !val.deleted ? val.content.getContent()[val.length - 1] : void 0;
  };
  var typeMapGetAll = (parent) => {
    const res = {};
    parent.doc ?? warnPrematureAccess();
    parent._map.forEach((value, key) => {
      if (!value.deleted) {
        res[key] = value.content.getContent()[value.length - 1];
      }
    });
    return res;
  };
  var typeMapHas = (parent, key) => {
    parent.doc ?? warnPrematureAccess();
    const val = parent._map.get(key);
    return val !== void 0 && !val.deleted;
  };
  var typeMapGetAllSnapshot = (parent, snapshot) => {
    const res = {};
    parent._map.forEach((value, key) => {
      let v = value;
      while (v !== null && (!snapshot.sv.has(v.id.client) || v.id.clock >= (snapshot.sv.get(v.id.client) || 0))) {
        v = v.left;
      }
      if (v !== null && isVisible(v, snapshot)) {
        res[key] = v.content.getContent()[v.length - 1];
      }
    });
    return res;
  };
  var createMapIterator = (type) => {
    type.doc ?? warnPrematureAccess();
    return iteratorFilter(
      type._map.entries(),
      /** @param {any} entry */
      (entry) => !entry[1].deleted
    );
  };
  var YArrayEvent = class extends YEvent {
  };
  var YArray = class _YArray extends AbstractType {
    constructor() {
      super();
      this._prelimContent = [];
      this._searchMarker = [];
    }
    /**
     * Construct a new YArray containing the specified items.
     * @template {Object<string,any>|Array<any>|number|null|string|Uint8Array} T
     * @param {Array<T>} items
     * @return {YArray<T>}
     */
    static from(items) {
      const a = new _YArray();
      a.push(items);
      return a;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this.insert(
        0,
        /** @type {Array<any>} */
        this._prelimContent
      );
      this._prelimContent = null;
    }
    /**
     * @return {YArray<T>}
     */
    _copy() {
      return new _YArray();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YArray<T>}
     */
    clone() {
      const arr = new _YArray();
      arr.insert(0, this.toArray().map(
        (el) => el instanceof AbstractType ? (
          /** @type {typeof el} */
          el.clone()
        ) : el
      ));
      return arr;
    }
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._length;
    }
    /**
     * Creates YArrayEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      super._callObserver(transaction, parentSubs);
      callTypeObservers(this, transaction, new YArrayEvent(this, transaction));
    }
    /**
     * Inserts new content at an index.
     *
     * Important: This function expects an array of content. Not just a content
     * object. The reason for this "weirdness" is that inserting several elements
     * is very efficient when it is done as a single operation.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  yarray.insert(0, ['a'])
     *  // Insert numbers 1, 2 at position 1
     *  yarray.insert(1, [1, 2])
     *
     * @param {number} index The index to insert content at.
     * @param {Array<T>} content The array of content
     */
    insert(index, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListInsertGenerics(
            transaction,
            this,
            index,
            /** @type {any} */
            content
          );
        });
      } else {
        this._prelimContent.splice(index, 0, ...content);
      }
    }
    /**
     * Appends content to this YArray.
     *
     * @param {Array<T>} content Array of content to append.
     *
     * @todo Use the following implementation in all types.
     */
    push(content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListPushGenerics(
            transaction,
            this,
            /** @type {any} */
            content
          );
        });
      } else {
        this._prelimContent.push(...content);
      }
    }
    /**
     * Prepends content to this YArray.
     *
     * @param {Array<T>} content Array of content to prepend.
     */
    unshift(content) {
      this.insert(0, content);
    }
    /**
     * Deletes elements starting from an index.
     *
     * @param {number} index Index at which to start deleting elements
     * @param {number} length The number of elements to remove. Defaults to 1.
     */
    delete(index, length3 = 1) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListDelete(transaction, this, index, length3);
        });
      } else {
        this._prelimContent.splice(index, length3);
      }
    }
    /**
     * Returns the i-th element from a YArray.
     *
     * @param {number} index The index of the element to return from the YArray
     * @return {T}
     */
    get(index) {
      return typeListGet(this, index);
    }
    /**
     * Transforms this YArray to a JavaScript Array.
     *
     * @return {Array<T>}
     */
    toArray() {
      return typeListToArray(this);
    }
    /**
     * Returns a portion of this YArray into a JavaScript Array selected
     * from start to end (end not included).
     *
     * @param {number} [start]
     * @param {number} [end]
     * @return {Array<T>}
     */
    slice(start = 0, end = this.length) {
      return typeListSlice(this, start, end);
    }
    /**
     * Transforms this Shared Type to a JSON object.
     *
     * @return {Array<any>}
     */
    toJSON() {
      return this.map((c) => c instanceof AbstractType ? c.toJSON() : c);
    }
    /**
     * Returns an Array with the result of calling a provided function on every
     * element of this YArray.
     *
     * @template M
     * @param {function(T,number,YArray<T>):M} f Function that produces an element of the new Array
     * @return {Array<M>} A new array with each element being the result of the
     *                 callback function
     */
    map(f) {
      return typeListMap(
        this,
        /** @type {any} */
        f
      );
    }
    /**
     * Executes a provided function once on every element of this YArray.
     *
     * @param {function(T,number,YArray<T>):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      typeListForEach(this, f);
    }
    /**
     * @return {IterableIterator<T>}
     */
    [Symbol.iterator]() {
      return typeListCreateIterator(this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YArrayRefID);
    }
  };
  var readYArray = (_decoder) => new YArray();
  var YMapEvent = class extends YEvent {
    /**
     * @param {YMap<T>} ymap The YArray that changed.
     * @param {Transaction} transaction
     * @param {Set<any>} subs The keys that changed.
     */
    constructor(ymap, transaction, subs) {
      super(ymap, transaction);
      this.keysChanged = subs;
    }
  };
  var YMap = class _YMap extends AbstractType {
    /**
     *
     * @param {Iterable<readonly [string, any]>=} entries - an optional iterable to initialize the YMap
     */
    constructor(entries) {
      super();
      this._prelimContent = null;
      if (entries === void 0) {
        this._prelimContent = /* @__PURE__ */ new Map();
      } else {
        this._prelimContent = new Map(entries);
      }
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this._prelimContent.forEach((value, key) => {
        this.set(key, value);
      });
      this._prelimContent = null;
    }
    /**
     * @return {YMap<MapType>}
     */
    _copy() {
      return new _YMap();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YMap<MapType>}
     */
    clone() {
      const map2 = new _YMap();
      this.forEach((value, key) => {
        map2.set(key, value instanceof AbstractType ? (
          /** @type {typeof value} */
          value.clone()
        ) : value);
      });
      return map2;
    }
    /**
     * Creates YMapEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      callTypeObservers(this, transaction, new YMapEvent(this, transaction, parentSubs));
    }
    /**
     * Transforms this Shared Type to a JSON object.
     *
     * @return {Object<string,any>}
     */
    toJSON() {
      this.doc ?? warnPrematureAccess();
      const map2 = {};
      this._map.forEach((item, key) => {
        if (!item.deleted) {
          const v = item.content.getContent()[item.length - 1];
          map2[key] = v instanceof AbstractType ? v.toJSON() : v;
        }
      });
      return map2;
    }
    /**
     * Returns the size of the YMap (count of key/value pairs)
     *
     * @return {number}
     */
    get size() {
      return [...createMapIterator(this)].length;
    }
    /**
     * Returns the keys for each element in the YMap Type.
     *
     * @return {IterableIterator<string>}
     */
    keys() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => v[0]
      );
    }
    /**
     * Returns the values for each element in the YMap Type.
     *
     * @return {IterableIterator<MapType>}
     */
    values() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => v[1].content.getContent()[v[1].length - 1]
      );
    }
    /**
     * Returns an Iterator of [key, value] pairs
     *
     * @return {IterableIterator<[string, MapType]>}
     */
    entries() {
      return iteratorMap(
        createMapIterator(this),
        /** @param {any} v */
        (v) => (
          /** @type {any} */
          [v[0], v[1].content.getContent()[v[1].length - 1]]
        )
      );
    }
    /**
     * Executes a provided function on once on every key-value pair.
     *
     * @param {function(MapType,string,YMap<MapType>):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      this.doc ?? warnPrematureAccess();
      this._map.forEach((item, key) => {
        if (!item.deleted) {
          f(item.content.getContent()[item.length - 1], key, this);
        }
      });
    }
    /**
     * Returns an Iterator of [key, value] pairs
     *
     * @return {IterableIterator<[string, MapType]>}
     */
    [Symbol.iterator]() {
      return this.entries();
    }
    /**
     * Remove a specified element from this YMap.
     *
     * @param {string} key The key of the element to remove.
     */
    delete(key) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, key);
        });
      } else {
        this._prelimContent.delete(key);
      }
    }
    /**
     * Adds or updates an element with a specified key and value.
     * @template {MapType} VAL
     *
     * @param {string} key The key of the element to add to this YMap
     * @param {VAL} value The value of the element to add
     * @return {VAL}
     */
    set(key, value) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(
            transaction,
            this,
            key,
            /** @type {any} */
            value
          );
        });
      } else {
        this._prelimContent.set(key, value);
      }
      return value;
    }
    /**
     * Returns a specified element from this YMap.
     *
     * @param {string} key
     * @return {MapType|undefined}
     */
    get(key) {
      return (
        /** @type {any} */
        typeMapGet(this, key)
      );
    }
    /**
     * Returns a boolean indicating whether the specified key exists or not.
     *
     * @param {string} key The key to test.
     * @return {boolean}
     */
    has(key) {
      return typeMapHas(this, key);
    }
    /**
     * Removes all elements from this YMap.
     */
    clear() {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          this.forEach(function(_value, key, map2) {
            typeMapDelete(transaction, map2, key);
          });
        });
      } else {
        this._prelimContent.clear();
      }
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YMapRefID);
    }
  };
  var readYMap = (_decoder) => new YMap();
  var equalAttrs = (a, b) => a === b || typeof a === "object" && typeof b === "object" && a && b && equalFlat(a, b);
  var ItemTextListPosition = class {
    /**
     * @param {Item|null} left
     * @param {Item|null} right
     * @param {number} index
     * @param {Map<string,any>} currentAttributes
     */
    constructor(left, right, index, currentAttributes) {
      this.left = left;
      this.right = right;
      this.index = index;
      this.currentAttributes = currentAttributes;
    }
    /**
     * Only call this if you know that this.right is defined
     */
    forward() {
      if (this.right === null) {
        unexpectedCase();
      }
      switch (this.right.content.constructor) {
        case ContentFormat:
          if (!this.right.deleted) {
            updateCurrentAttributes(
              this.currentAttributes,
              /** @type {ContentFormat} */
              this.right.content
            );
          }
          break;
        default:
          if (!this.right.deleted) {
            this.index += this.right.length;
          }
          break;
      }
      this.left = this.right;
      this.right = this.right.right;
    }
  };
  var findNextPosition = (transaction, pos, count) => {
    while (pos.right !== null && count > 0) {
      switch (pos.right.content.constructor) {
        case ContentFormat:
          if (!pos.right.deleted) {
            updateCurrentAttributes(
              pos.currentAttributes,
              /** @type {ContentFormat} */
              pos.right.content
            );
          }
          break;
        default:
          if (!pos.right.deleted) {
            if (count < pos.right.length) {
              getItemCleanStart(transaction, createID(pos.right.id.client, pos.right.id.clock + count));
            }
            pos.index += pos.right.length;
            count -= pos.right.length;
          }
          break;
      }
      pos.left = pos.right;
      pos.right = pos.right.right;
    }
    return pos;
  };
  var findPosition = (transaction, parent, index, useSearchMarker) => {
    const currentAttributes = /* @__PURE__ */ new Map();
    const marker = useSearchMarker ? findMarker(parent, index) : null;
    if (marker) {
      const pos = new ItemTextListPosition(marker.p.left, marker.p, marker.index, currentAttributes);
      return findNextPosition(transaction, pos, index - marker.index);
    } else {
      const pos = new ItemTextListPosition(null, parent._start, 0, currentAttributes);
      return findNextPosition(transaction, pos, index);
    }
  };
  var insertNegatedAttributes = (transaction, parent, currPos, negatedAttributes) => {
    while (currPos.right !== null && (currPos.right.deleted === true || currPos.right.content.constructor === ContentFormat && equalAttrs(
      negatedAttributes.get(
        /** @type {ContentFormat} */
        currPos.right.content.key
      ),
      /** @type {ContentFormat} */
      currPos.right.content.value
    ))) {
      if (!currPos.right.deleted) {
        negatedAttributes.delete(
          /** @type {ContentFormat} */
          currPos.right.content.key
        );
      }
      currPos.forward();
    }
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    negatedAttributes.forEach((val, key) => {
      const left = currPos.left;
      const right = currPos.right;
      const nextFormat = new Item(createID(ownClientId, getState(doc2.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
      nextFormat.integrate(transaction, 0);
      currPos.right = nextFormat;
      currPos.forward();
    });
  };
  var updateCurrentAttributes = (currentAttributes, format) => {
    const { key, value } = format;
    if (value === null) {
      currentAttributes.delete(key);
    } else {
      currentAttributes.set(key, value);
    }
  };
  var minimizeAttributeChanges = (currPos, attributes) => {
    while (true) {
      if (currPos.right === null) {
        break;
      } else if (currPos.right.deleted || currPos.right.content.constructor === ContentFormat && equalAttrs(
        attributes[
          /** @type {ContentFormat} */
          currPos.right.content.key
        ] ?? null,
        /** @type {ContentFormat} */
        currPos.right.content.value
      )) ;
      else {
        break;
      }
      currPos.forward();
    }
  };
  var insertAttributes = (transaction, parent, currPos, attributes) => {
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    const negatedAttributes = /* @__PURE__ */ new Map();
    for (const key in attributes) {
      const val = attributes[key];
      const currentVal = currPos.currentAttributes.get(key) ?? null;
      if (!equalAttrs(currentVal, val)) {
        negatedAttributes.set(key, currentVal);
        const { left, right } = currPos;
        currPos.right = new Item(createID(ownClientId, getState(doc2.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, new ContentFormat(key, val));
        currPos.right.integrate(transaction, 0);
        currPos.forward();
      }
    }
    return negatedAttributes;
  };
  var insertText = (transaction, parent, currPos, text2, attributes) => {
    currPos.currentAttributes.forEach((_val, key) => {
      if (attributes[key] === void 0) {
        attributes[key] = null;
      }
    });
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    minimizeAttributeChanges(currPos, attributes);
    const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
    const content = text2.constructor === String ? new ContentString(
      /** @type {string} */
      text2
    ) : text2 instanceof AbstractType ? new ContentType(text2) : new ContentEmbed(text2);
    let { left, right, index } = currPos;
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, currPos.index, content.getLength());
    }
    right = new Item(createID(ownClientId, getState(doc2.store, ownClientId)), left, left && left.lastId, right, right && right.id, parent, null, content);
    right.integrate(transaction, 0);
    currPos.right = right;
    currPos.index = index;
    currPos.forward();
    insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
  };
  var formatText = (transaction, parent, currPos, length3, attributes) => {
    const doc2 = transaction.doc;
    const ownClientId = doc2.clientID;
    minimizeAttributeChanges(currPos, attributes);
    const negatedAttributes = insertAttributes(transaction, parent, currPos, attributes);
    iterationLoop: while (currPos.right !== null && (length3 > 0 || negatedAttributes.size > 0 && (currPos.right.deleted || currPos.right.content.constructor === ContentFormat))) {
      if (!currPos.right.deleted) {
        switch (currPos.right.content.constructor) {
          case ContentFormat: {
            const { key, value } = (
              /** @type {ContentFormat} */
              currPos.right.content
            );
            const attr = attributes[key];
            if (attr !== void 0) {
              if (equalAttrs(attr, value)) {
                negatedAttributes.delete(key);
              } else {
                if (length3 === 0) {
                  break iterationLoop;
                }
                negatedAttributes.set(key, value);
              }
              currPos.right.delete(transaction);
            } else {
              currPos.currentAttributes.set(key, value);
            }
            break;
          }
          default:
            if (length3 < currPos.right.length) {
              getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length3));
            }
            length3 -= currPos.right.length;
            break;
        }
      }
      currPos.forward();
    }
    if (length3 > 0) {
      let newlines = "";
      for (; length3 > 0; length3--) {
        newlines += "\n";
      }
      currPos.right = new Item(createID(ownClientId, getState(doc2.store, ownClientId)), currPos.left, currPos.left && currPos.left.lastId, currPos.right, currPos.right && currPos.right.id, parent, null, new ContentString(newlines));
      currPos.right.integrate(transaction, 0);
      currPos.forward();
    }
    insertNegatedAttributes(transaction, parent, currPos, negatedAttributes);
  };
  var cleanupFormattingGap = (transaction, start, curr, startAttributes, currAttributes) => {
    let end = start;
    const endFormats = create();
    while (end && (!end.countable || end.deleted)) {
      if (!end.deleted && end.content.constructor === ContentFormat) {
        const cf = (
          /** @type {ContentFormat} */
          end.content
        );
        endFormats.set(cf.key, cf);
      }
      end = end.right;
    }
    let cleanups = 0;
    let reachedCurr = false;
    while (start !== end) {
      if (curr === start) {
        reachedCurr = true;
      }
      if (!start.deleted) {
        const content = start.content;
        switch (content.constructor) {
          case ContentFormat: {
            const { key, value } = (
              /** @type {ContentFormat} */
              content
            );
            const startAttrValue = startAttributes.get(key) ?? null;
            if (endFormats.get(key) !== content || startAttrValue === value) {
              start.delete(transaction);
              cleanups++;
              if (!reachedCurr && (currAttributes.get(key) ?? null) === value && startAttrValue !== value) {
                if (startAttrValue === null) {
                  currAttributes.delete(key);
                } else {
                  currAttributes.set(key, startAttrValue);
                }
              }
            }
            if (!reachedCurr && !start.deleted) {
              updateCurrentAttributes(
                currAttributes,
                /** @type {ContentFormat} */
                content
              );
            }
            break;
          }
        }
      }
      start = /** @type {Item} */
      start.right;
    }
    return cleanups;
  };
  var cleanupContextlessFormattingGap = (transaction, item) => {
    while (item && item.right && (item.right.deleted || !item.right.countable)) {
      item = item.right;
    }
    const attrs = /* @__PURE__ */ new Set();
    while (item && (item.deleted || !item.countable)) {
      if (!item.deleted && item.content.constructor === ContentFormat) {
        const key = (
          /** @type {ContentFormat} */
          item.content.key
        );
        if (attrs.has(key)) {
          item.delete(transaction);
        } else {
          attrs.add(key);
        }
      }
      item = item.left;
    }
  };
  var cleanupYTextFormatting = (type) => {
    let res = 0;
    transact(
      /** @type {Doc} */
      type.doc,
      (transaction) => {
        let start = (
          /** @type {Item} */
          type._start
        );
        let end = type._start;
        let startAttributes = create();
        const currentAttributes = copy(startAttributes);
        while (end) {
          if (end.deleted === false) {
            switch (end.content.constructor) {
              case ContentFormat:
                updateCurrentAttributes(
                  currentAttributes,
                  /** @type {ContentFormat} */
                  end.content
                );
                break;
              default:
                res += cleanupFormattingGap(transaction, start, end, startAttributes, currentAttributes);
                startAttributes = copy(currentAttributes);
                start = end;
                break;
            }
          }
          end = end.right;
        }
      }
    );
    return res;
  };
  var cleanupYTextAfterTransaction = (transaction) => {
    const needFullCleanup = /* @__PURE__ */ new Set();
    const doc2 = transaction.doc;
    for (const [client, afterClock] of transaction.afterState.entries()) {
      const clock = transaction.beforeState.get(client) || 0;
      if (afterClock === clock) {
        continue;
      }
      iterateStructs(
        transaction,
        /** @type {Array<Item|GC>} */
        doc2.store.clients.get(client),
        clock,
        afterClock,
        (item) => {
          if (!item.deleted && /** @type {Item} */
          item.content.constructor === ContentFormat && item.constructor !== GC) {
            needFullCleanup.add(
              /** @type {any} */
              item.parent
            );
          }
        }
      );
    }
    transact(doc2, (t) => {
      iterateDeletedStructs(transaction, transaction.deleteSet, (item) => {
        if (item instanceof GC || !/** @type {YText} */
        item.parent._hasFormatting || needFullCleanup.has(
          /** @type {YText} */
          item.parent
        )) {
          return;
        }
        const parent = (
          /** @type {YText} */
          item.parent
        );
        if (item.content.constructor === ContentFormat) {
          needFullCleanup.add(parent);
        } else {
          cleanupContextlessFormattingGap(t, item);
        }
      });
      for (const yText of needFullCleanup) {
        cleanupYTextFormatting(yText);
      }
    });
  };
  var deleteText = (transaction, currPos, length3) => {
    const startLength = length3;
    const startAttrs = copy(currPos.currentAttributes);
    const start = currPos.right;
    while (length3 > 0 && currPos.right !== null) {
      if (currPos.right.deleted === false) {
        switch (currPos.right.content.constructor) {
          case ContentType:
          case ContentEmbed:
          case ContentString:
            if (length3 < currPos.right.length) {
              getItemCleanStart(transaction, createID(currPos.right.id.client, currPos.right.id.clock + length3));
            }
            length3 -= currPos.right.length;
            currPos.right.delete(transaction);
            break;
        }
      }
      currPos.forward();
    }
    if (start) {
      cleanupFormattingGap(transaction, start, currPos.right, startAttrs, currPos.currentAttributes);
    }
    const parent = (
      /** @type {AbstractType<any>} */
      /** @type {Item} */
      (currPos.left || currPos.right).parent
    );
    if (parent._searchMarker) {
      updateMarkerChanges(parent._searchMarker, currPos.index, -startLength + length3);
    }
    return currPos;
  };
  var YTextEvent = class extends YEvent {
    /**
     * @param {YText} ytext
     * @param {Transaction} transaction
     * @param {Set<any>} subs The keys that changed
     */
    constructor(ytext, transaction, subs) {
      super(ytext, transaction);
      this.childListChanged = false;
      this.keysChanged = /* @__PURE__ */ new Set();
      subs.forEach((sub) => {
        if (sub === null) {
          this.childListChanged = true;
        } else {
          this.keysChanged.add(sub);
        }
      });
    }
    /**
     * @type {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert?:Array<any>|string, delete?:number, retain?:number}>}}
     */
    get changes() {
      if (this._changes === null) {
        const changes = {
          keys: this.keys,
          delta: this.delta,
          added: /* @__PURE__ */ new Set(),
          deleted: /* @__PURE__ */ new Set()
        };
        this._changes = changes;
      }
      return (
        /** @type {any} */
        this._changes
      );
    }
    /**
     * Compute the changes in the delta format.
     * A {@link https://quilljs.com/docs/delta/|Quill Delta}) that represents the changes on the document.
     *
     * @type {Array<{insert?:string|object|AbstractType<any>, delete?:number, retain?:number, attributes?: Object<string,any>}>}
     *
     * @public
     */
    get delta() {
      if (this._delta === null) {
        const y = (
          /** @type {Doc} */
          this.target.doc
        );
        const delta = [];
        transact(y, (transaction) => {
          const currentAttributes = /* @__PURE__ */ new Map();
          const oldAttributes = /* @__PURE__ */ new Map();
          let item = this.target._start;
          let action = null;
          const attributes = {};
          let insert = "";
          let retain = 0;
          let deleteLen = 0;
          const addOp = () => {
            if (action !== null) {
              let op = null;
              switch (action) {
                case "delete":
                  if (deleteLen > 0) {
                    op = { delete: deleteLen };
                  }
                  deleteLen = 0;
                  break;
                case "insert":
                  if (typeof insert === "object" || insert.length > 0) {
                    op = { insert };
                    if (currentAttributes.size > 0) {
                      op.attributes = {};
                      currentAttributes.forEach((value, key) => {
                        if (value !== null) {
                          op.attributes[key] = value;
                        }
                      });
                    }
                  }
                  insert = "";
                  break;
                case "retain":
                  if (retain > 0) {
                    op = { retain };
                    if (!isEmpty(attributes)) {
                      op.attributes = assign({}, attributes);
                    }
                  }
                  retain = 0;
                  break;
              }
              if (op) delta.push(op);
              action = null;
            }
          };
          while (item !== null) {
            switch (item.content.constructor) {
              case ContentType:
              case ContentEmbed:
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    addOp();
                    action = "insert";
                    insert = item.content.getContent()[0];
                    addOp();
                  }
                } else if (this.deletes(item)) {
                  if (action !== "delete") {
                    addOp();
                    action = "delete";
                  }
                  deleteLen += 1;
                } else if (!item.deleted) {
                  if (action !== "retain") {
                    addOp();
                    action = "retain";
                  }
                  retain += 1;
                }
                break;
              case ContentString:
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    if (action !== "insert") {
                      addOp();
                      action = "insert";
                    }
                    insert += /** @type {ContentString} */
                    item.content.str;
                  }
                } else if (this.deletes(item)) {
                  if (action !== "delete") {
                    addOp();
                    action = "delete";
                  }
                  deleteLen += item.length;
                } else if (!item.deleted) {
                  if (action !== "retain") {
                    addOp();
                    action = "retain";
                  }
                  retain += item.length;
                }
                break;
              case ContentFormat: {
                const { key, value } = (
                  /** @type {ContentFormat} */
                  item.content
                );
                if (this.adds(item)) {
                  if (!this.deletes(item)) {
                    const curVal = currentAttributes.get(key) ?? null;
                    if (!equalAttrs(curVal, value)) {
                      if (action === "retain") {
                        addOp();
                      }
                      if (equalAttrs(value, oldAttributes.get(key) ?? null)) {
                        delete attributes[key];
                      } else {
                        attributes[key] = value;
                      }
                    } else if (value !== null) {
                      item.delete(transaction);
                    }
                  }
                } else if (this.deletes(item)) {
                  oldAttributes.set(key, value);
                  const curVal = currentAttributes.get(key) ?? null;
                  if (!equalAttrs(curVal, value)) {
                    if (action === "retain") {
                      addOp();
                    }
                    attributes[key] = curVal;
                  }
                } else if (!item.deleted) {
                  oldAttributes.set(key, value);
                  const attr = attributes[key];
                  if (attr !== void 0) {
                    if (!equalAttrs(attr, value)) {
                      if (action === "retain") {
                        addOp();
                      }
                      if (value === null) {
                        delete attributes[key];
                      } else {
                        attributes[key] = value;
                      }
                    } else if (attr !== null) {
                      item.delete(transaction);
                    }
                  }
                }
                if (!item.deleted) {
                  if (action === "insert") {
                    addOp();
                  }
                  updateCurrentAttributes(
                    currentAttributes,
                    /** @type {ContentFormat} */
                    item.content
                  );
                }
                break;
              }
            }
            item = item.right;
          }
          addOp();
          while (delta.length > 0) {
            const lastOp = delta[delta.length - 1];
            if (lastOp.retain !== void 0 && lastOp.attributes === void 0) {
              delta.pop();
            } else {
              break;
            }
          }
        });
        this._delta = delta;
      }
      return (
        /** @type {any} */
        this._delta
      );
    }
  };
  var YText = class _YText extends AbstractType {
    /**
     * @param {String} [string] The initial value of the YText.
     */
    constructor(string) {
      super();
      this._pending = string !== void 0 ? [() => this.insert(0, string)] : [];
      this._searchMarker = [];
      this._hasFormatting = false;
    }
    /**
     * Number of characters of this text type.
     *
     * @type {number}
     */
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._length;
    }
    /**
     * @param {Doc} y
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      try {
        this._pending.forEach((f) => f());
      } catch (e) {
        console.error(e);
      }
      this._pending = null;
    }
    _copy() {
      return new _YText();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YText}
     */
    clone() {
      const text2 = new _YText();
      text2.applyDelta(this.toDelta());
      return text2;
    }
    /**
     * Creates YTextEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      super._callObserver(transaction, parentSubs);
      const event = new YTextEvent(this, transaction, parentSubs);
      callTypeObservers(this, transaction, event);
      if (!transaction.local && this._hasFormatting) {
        transaction._needFormattingCleanup = true;
      }
    }
    /**
     * Returns the unformatted string representation of this YText type.
     *
     * @public
     */
    toString() {
      this.doc ?? warnPrematureAccess();
      let str = "";
      let n = this._start;
      while (n !== null) {
        if (!n.deleted && n.countable && n.content.constructor === ContentString) {
          str += /** @type {ContentString} */
          n.content.str;
        }
        n = n.right;
      }
      return str;
    }
    /**
     * Returns the unformatted string representation of this YText type.
     *
     * @return {string}
     * @public
     */
    toJSON() {
      return this.toString();
    }
    /**
     * Apply a {@link Delta} on this shared YText type.
     *
     * @param {Array<any>} delta The changes to apply on this element.
     * @param {object}  opts
     * @param {boolean} [opts.sanitize] Sanitize input delta. Removes ending newlines if set to true.
     *
     *
     * @public
     */
    applyDelta(delta, { sanitize = true } = {}) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          const currPos = new ItemTextListPosition(null, this._start, 0, /* @__PURE__ */ new Map());
          for (let i = 0; i < delta.length; i++) {
            const op = delta[i];
            if (op.insert !== void 0) {
              const ins = !sanitize && typeof op.insert === "string" && i === delta.length - 1 && currPos.right === null && op.insert.slice(-1) === "\n" ? op.insert.slice(0, -1) : op.insert;
              if (typeof ins !== "string" || ins.length > 0) {
                insertText(transaction, this, currPos, ins, op.attributes || {});
              }
            } else if (op.retain !== void 0) {
              formatText(transaction, this, currPos, op.retain, op.attributes || {});
            } else if (op.delete !== void 0) {
              deleteText(transaction, currPos, op.delete);
            }
          }
        });
      } else {
        this._pending.push(() => this.applyDelta(delta));
      }
    }
    /**
     * Returns the Delta representation of this YText type.
     *
     * @param {Snapshot} [snapshot]
     * @param {Snapshot} [prevSnapshot]
     * @param {function('removed' | 'added', ID):any} [computeYChange]
     * @return {any} The Delta representation of this type.
     *
     * @public
     */
    toDelta(snapshot, prevSnapshot, computeYChange) {
      this.doc ?? warnPrematureAccess();
      const ops = [];
      const currentAttributes = /* @__PURE__ */ new Map();
      const doc2 = (
        /** @type {Doc} */
        this.doc
      );
      let str = "";
      let n = this._start;
      function packStr() {
        if (str.length > 0) {
          const attributes = {};
          let addAttributes = false;
          currentAttributes.forEach((value, key) => {
            addAttributes = true;
            attributes[key] = value;
          });
          const op = { insert: str };
          if (addAttributes) {
            op.attributes = attributes;
          }
          ops.push(op);
          str = "";
        }
      }
      const computeDelta = () => {
        while (n !== null) {
          if (isVisible(n, snapshot) || prevSnapshot !== void 0 && isVisible(n, prevSnapshot)) {
            switch (n.content.constructor) {
              case ContentString: {
                const cur = currentAttributes.get("ychange");
                if (snapshot !== void 0 && !isVisible(n, snapshot)) {
                  if (cur === void 0 || cur.user !== n.id.client || cur.type !== "removed") {
                    packStr();
                    currentAttributes.set("ychange", computeYChange ? computeYChange("removed", n.id) : { type: "removed" });
                  }
                } else if (prevSnapshot !== void 0 && !isVisible(n, prevSnapshot)) {
                  if (cur === void 0 || cur.user !== n.id.client || cur.type !== "added") {
                    packStr();
                    currentAttributes.set("ychange", computeYChange ? computeYChange("added", n.id) : { type: "added" });
                  }
                } else if (cur !== void 0) {
                  packStr();
                  currentAttributes.delete("ychange");
                }
                str += /** @type {ContentString} */
                n.content.str;
                break;
              }
              case ContentType:
              case ContentEmbed: {
                packStr();
                const op = {
                  insert: n.content.getContent()[0]
                };
                if (currentAttributes.size > 0) {
                  const attrs = (
                    /** @type {Object<string,any>} */
                    {}
                  );
                  op.attributes = attrs;
                  currentAttributes.forEach((value, key) => {
                    attrs[key] = value;
                  });
                }
                ops.push(op);
                break;
              }
              case ContentFormat:
                if (isVisible(n, snapshot)) {
                  packStr();
                  updateCurrentAttributes(
                    currentAttributes,
                    /** @type {ContentFormat} */
                    n.content
                  );
                }
                break;
            }
          }
          n = n.right;
        }
        packStr();
      };
      if (snapshot || prevSnapshot) {
        transact(doc2, (transaction) => {
          if (snapshot) {
            splitSnapshotAffectedStructs(transaction, snapshot);
          }
          if (prevSnapshot) {
            splitSnapshotAffectedStructs(transaction, prevSnapshot);
          }
          computeDelta();
        }, "cleanup");
      } else {
        computeDelta();
      }
      return ops;
    }
    /**
     * Insert text at a given index.
     *
     * @param {number} index The index at which to start inserting.
     * @param {String} text The text to insert at the specified position.
     * @param {TextAttributes} [attributes] Optionally define some formatting
     *                                    information to apply on the inserted
     *                                    Text.
     * @public
     */
    insert(index, text2, attributes) {
      if (text2.length <= 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, !attributes);
          if (!attributes) {
            attributes = {};
            pos.currentAttributes.forEach((v, k) => {
              attributes[k] = v;
            });
          }
          insertText(transaction, this, pos, text2, attributes);
        });
      } else {
        this._pending.push(() => this.insert(index, text2, attributes));
      }
    }
    /**
     * Inserts an embed at a index.
     *
     * @param {number} index The index to insert the embed at.
     * @param {Object | AbstractType<any>} embed The Object that represents the embed.
     * @param {TextAttributes} [attributes] Attribute information to apply on the
     *                                    embed
     *
     * @public
     */
    insertEmbed(index, embed, attributes) {
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, !attributes);
          insertText(transaction, this, pos, embed, attributes || {});
        });
      } else {
        this._pending.push(() => this.insertEmbed(index, embed, attributes || {}));
      }
    }
    /**
     * Deletes text starting from an index.
     *
     * @param {number} index Index at which to start deleting.
     * @param {number} length The number of characters to remove. Defaults to 1.
     *
     * @public
     */
    delete(index, length3) {
      if (length3 === 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          deleteText(transaction, findPosition(transaction, this, index, true), length3);
        });
      } else {
        this._pending.push(() => this.delete(index, length3));
      }
    }
    /**
     * Assigns properties to a range of text.
     *
     * @param {number} index The position where to start formatting.
     * @param {number} length The amount of characters to assign properties to.
     * @param {TextAttributes} attributes Attribute information to apply on the
     *                                    text.
     *
     * @public
     */
    format(index, length3, attributes) {
      if (length3 === 0) {
        return;
      }
      const y = this.doc;
      if (y !== null) {
        transact(y, (transaction) => {
          const pos = findPosition(transaction, this, index, false);
          if (pos.right === null) {
            return;
          }
          formatText(transaction, this, pos, length3, attributes);
        });
      } else {
        this._pending.push(() => this.format(index, length3, attributes));
      }
    }
    /**
     * Removes an attribute.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that is to be removed.
     *
     * @public
     */
    removeAttribute(attributeName) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, attributeName);
        });
      } else {
        this._pending.push(() => this.removeAttribute(attributeName));
      }
    }
    /**
     * Sets or updates an attribute.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that is to be set.
     * @param {any} attributeValue The attribute value that is to be set.
     *
     * @public
     */
    setAttribute(attributeName, attributeValue) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(transaction, this, attributeName, attributeValue);
        });
      } else {
        this._pending.push(() => this.setAttribute(attributeName, attributeValue));
      }
    }
    /**
     * Returns an attribute value that belongs to the attribute name.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @param {String} attributeName The attribute name that identifies the
     *                               queried value.
     * @return {any} The queried attribute value.
     *
     * @public
     */
    getAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapGet(this, attributeName)
      );
    }
    /**
     * Returns all attribute name/value pairs in a JSON Object.
     *
     * @note Xml-Text nodes don't have attributes. You can use this feature to assign properties to complete text-blocks.
     *
     * @return {Object<string, any>} A JSON Object that describes the attributes.
     *
     * @public
     */
    getAttributes() {
      return typeMapGetAll(this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YTextRefID);
    }
  };
  var readYText = (_decoder) => new YText();
  var YXmlTreeWalker = class {
    /**
     * @param {YXmlFragment | YXmlElement} root
     * @param {function(AbstractType<any>):boolean} [f]
     */
    constructor(root, f = () => true) {
      this._filter = f;
      this._root = root;
      this._currentNode = /** @type {Item} */
      root._start;
      this._firstCall = true;
      root.doc ?? warnPrematureAccess();
    }
    [Symbol.iterator]() {
      return this;
    }
    /**
     * Get the next node.
     *
     * @return {IteratorResult<YXmlElement|YXmlText|YXmlHook>} The next node.
     *
     * @public
     */
    next() {
      let n = this._currentNode;
      let type = n && n.content && /** @type {any} */
      n.content.type;
      if (n !== null && (!this._firstCall || n.deleted || !this._filter(type))) {
        do {
          type = /** @type {any} */
          n.content.type;
          if (!n.deleted && (type.constructor === YXmlElement || type.constructor === YXmlFragment) && type._start !== null) {
            n = type._start;
          } else {
            while (n !== null) {
              const nxt = n.next;
              if (nxt !== null) {
                n = nxt;
                break;
              } else if (n.parent === this._root) {
                n = null;
              } else {
                n = /** @type {AbstractType<any>} */
                n.parent._item;
              }
            }
          }
        } while (n !== null && (n.deleted || !this._filter(
          /** @type {ContentType} */
          n.content.type
        )));
      }
      this._firstCall = false;
      if (n === null) {
        return { value: void 0, done: true };
      }
      this._currentNode = n;
      return { value: (
        /** @type {any} */
        n.content.type
      ), done: false };
    }
  };
  var YXmlFragment = class _YXmlFragment extends AbstractType {
    constructor() {
      super();
      this._prelimContent = [];
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get firstChild() {
      const first = this._first;
      return first ? first.content.getContent()[0] : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      this.insert(
        0,
        /** @type {Array<any>} */
        this._prelimContent
      );
      this._prelimContent = null;
    }
    _copy() {
      return new _YXmlFragment();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlFragment}
     */
    clone() {
      const el = new _YXmlFragment();
      el.insert(0, this.toArray().map((item) => item instanceof AbstractType ? item.clone() : item));
      return el;
    }
    get length() {
      this.doc ?? warnPrematureAccess();
      return this._prelimContent === null ? this._length : this._prelimContent.length;
    }
    /**
     * Create a subtree of childNodes.
     *
     * @example
     * const walker = elem.createTreeWalker(dom => dom.nodeName === 'div')
     * for (let node in walker) {
     *   // `node` is a div node
     *   nop(node)
     * }
     *
     * @param {function(AbstractType<any>):boolean} filter Function that is called on each child element and
     *                          returns a Boolean indicating whether the child
     *                          is to be included in the subtree.
     * @return {YXmlTreeWalker} A subtree and a position within it.
     *
     * @public
     */
    createTreeWalker(filter) {
      return new YXmlTreeWalker(this, filter);
    }
    /**
     * Returns the first YXmlElement that matches the query.
     * Similar to DOM's {@link querySelector}.
     *
     * Query support:
     *   - tagname
     * TODO:
     *   - id
     *   - attribute
     *
     * @param {CSS_Selector} query The query on the children.
     * @return {YXmlElement|YXmlText|YXmlHook|null} The first element that matches the query or null.
     *
     * @public
     */
    querySelector(query) {
      query = query.toUpperCase();
      const iterator = new YXmlTreeWalker(this, (element2) => element2.nodeName && element2.nodeName.toUpperCase() === query);
      const next = iterator.next();
      if (next.done) {
        return null;
      } else {
        return next.value;
      }
    }
    /**
     * Returns all YXmlElements that match the query.
     * Similar to Dom's {@link querySelectorAll}.
     *
     * @todo Does not yet support all queries. Currently only query by tagName.
     *
     * @param {CSS_Selector} query The query on the children
     * @return {Array<YXmlElement|YXmlText|YXmlHook|null>} The elements that match this query.
     *
     * @public
     */
    querySelectorAll(query) {
      query = query.toUpperCase();
      return from(new YXmlTreeWalker(this, (element2) => element2.nodeName && element2.nodeName.toUpperCase() === query));
    }
    /**
     * Creates YXmlEvent and calls observers.
     *
     * @param {Transaction} transaction
     * @param {Set<null|string>} parentSubs Keys changed on this type. `null` if list was modified.
     */
    _callObserver(transaction, parentSubs) {
      callTypeObservers(this, transaction, new YXmlEvent(this, parentSubs, transaction));
    }
    /**
     * Get the string representation of all the children of this YXmlFragment.
     *
     * @return {string} The string representation of all children.
     */
    toString() {
      return typeListMap(this, (xml) => xml.toString()).join("");
    }
    /**
     * @return {string}
     */
    toJSON() {
      return this.toString();
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const fragment = _document.createDocumentFragment();
      if (binding !== void 0) {
        binding._createAssociation(fragment, this);
      }
      typeListForEach(this, (xmlType) => {
        fragment.insertBefore(xmlType.toDOM(_document, hooks, binding), null);
      });
      return fragment;
    }
    /**
     * Inserts new content at an index.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  xml.insert(0, [new Y.XmlText('text')])
     *
     * @param {number} index The index to insert content at
     * @param {Array<YXmlElement|YXmlText>} content The array of content
     */
    insert(index, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListInsertGenerics(transaction, this, index, content);
        });
      } else {
        this._prelimContent.splice(index, 0, ...content);
      }
    }
    /**
     * Inserts new content at an index.
     *
     * @example
     *  // Insert character 'a' at position 0
     *  xml.insert(0, [new Y.XmlText('text')])
     *
     * @param {null|Item|YXmlElement|YXmlText} ref The index to insert content at
     * @param {Array<YXmlElement|YXmlText>} content The array of content
     */
    insertAfter(ref, content) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          const refItem = ref && ref instanceof AbstractType ? ref._item : ref;
          typeListInsertGenericsAfter(transaction, this, refItem, content);
        });
      } else {
        const pc = (
          /** @type {Array<any>} */
          this._prelimContent
        );
        const index = ref === null ? 0 : pc.findIndex((el) => el === ref) + 1;
        if (index === 0 && ref !== null) {
          throw create3("Reference item not found");
        }
        pc.splice(index, 0, ...content);
      }
    }
    /**
     * Deletes elements starting from an index.
     *
     * @param {number} index Index at which to start deleting elements
     * @param {number} [length=1] The number of elements to remove. Defaults to 1.
     */
    delete(index, length3 = 1) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeListDelete(transaction, this, index, length3);
        });
      } else {
        this._prelimContent.splice(index, length3);
      }
    }
    /**
     * Transforms this YArray to a JavaScript Array.
     *
     * @return {Array<YXmlElement|YXmlText|YXmlHook>}
     */
    toArray() {
      return typeListToArray(this);
    }
    /**
     * Appends content to this YArray.
     *
     * @param {Array<YXmlElement|YXmlText>} content Array of content to append.
     */
    push(content) {
      this.insert(this.length, content);
    }
    /**
     * Prepends content to this YArray.
     *
     * @param {Array<YXmlElement|YXmlText>} content Array of content to prepend.
     */
    unshift(content) {
      this.insert(0, content);
    }
    /**
     * Returns the i-th element from a YArray.
     *
     * @param {number} index The index of the element to return from the YArray
     * @return {YXmlElement|YXmlText}
     */
    get(index) {
      return typeListGet(this, index);
    }
    /**
     * Returns a portion of this YXmlFragment into a JavaScript Array selected
     * from start to end (end not included).
     *
     * @param {number} [start]
     * @param {number} [end]
     * @return {Array<YXmlElement|YXmlText>}
     */
    slice(start = 0, end = this.length) {
      return typeListSlice(this, start, end);
    }
    /**
     * Executes a provided function on once on every child element.
     *
     * @param {function(YXmlElement|YXmlText,number, typeof self):void} f A function to execute on every element of this YArray.
     */
    forEach(f) {
      typeListForEach(this, f);
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlFragmentRefID);
    }
  };
  var readYXmlFragment = (_decoder) => new YXmlFragment();
  var YXmlElement = class _YXmlElement extends YXmlFragment {
    constructor(nodeName = "UNDEFINED") {
      super();
      this.nodeName = nodeName;
      this._prelimAttrs = /* @__PURE__ */ new Map();
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get nextSibling() {
      const n = this._item ? this._item.next : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get prevSibling() {
      const n = this._item ? this._item.prev : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * Integrate this type into the Yjs instance.
     *
     * * Save this struct in the os
     * * This type is sent to other client
     * * Observer functions are fired
     *
     * @param {Doc} y The Yjs instance
     * @param {Item} item
     */
    _integrate(y, item) {
      super._integrate(y, item);
      /** @type {Map<string, any>} */
      this._prelimAttrs.forEach((value, key) => {
        this.setAttribute(key, value);
      });
      this._prelimAttrs = null;
    }
    /**
     * Creates an Item with the same effect as this Item (without position effect)
     *
     * @return {YXmlElement}
     */
    _copy() {
      return new _YXmlElement(this.nodeName);
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlElement<KV>}
     */
    clone() {
      const el = new _YXmlElement(this.nodeName);
      const attrs = this.getAttributes();
      forEach(attrs, (value, key) => {
        el.setAttribute(
          key,
          /** @type {any} */
          value
        );
      });
      el.insert(0, this.toArray().map((v) => v instanceof AbstractType ? v.clone() : v));
      return el;
    }
    /**
     * Returns the XML serialization of this YXmlElement.
     * The attributes are ordered by attribute-name, so you can easily use this
     * method to compare YXmlElements
     *
     * @return {string} The string representation of this type.
     *
     * @public
     */
    toString() {
      const attrs = this.getAttributes();
      const stringBuilder = [];
      const keys3 = [];
      for (const key in attrs) {
        keys3.push(key);
      }
      keys3.sort();
      const keysLen = keys3.length;
      for (let i = 0; i < keysLen; i++) {
        const key = keys3[i];
        stringBuilder.push(key + '="' + attrs[key] + '"');
      }
      const nodeName = this.nodeName.toLocaleLowerCase();
      const attrsString = stringBuilder.length > 0 ? " " + stringBuilder.join(" ") : "";
      return `<${nodeName}${attrsString}>${super.toString()}</${nodeName}>`;
    }
    /**
     * Removes an attribute from this YXmlElement.
     *
     * @param {string} attributeName The attribute name that is to be removed.
     *
     * @public
     */
    removeAttribute(attributeName) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapDelete(transaction, this, attributeName);
        });
      } else {
        this._prelimAttrs.delete(attributeName);
      }
    }
    /**
     * Sets or updates an attribute.
     *
     * @template {keyof KV & string} KEY
     *
     * @param {KEY} attributeName The attribute name that is to be set.
     * @param {KV[KEY]} attributeValue The attribute value that is to be set.
     *
     * @public
     */
    setAttribute(attributeName, attributeValue) {
      if (this.doc !== null) {
        transact(this.doc, (transaction) => {
          typeMapSet(transaction, this, attributeName, attributeValue);
        });
      } else {
        this._prelimAttrs.set(attributeName, attributeValue);
      }
    }
    /**
     * Returns an attribute value that belongs to the attribute name.
     *
     * @template {keyof KV & string} KEY
     *
     * @param {KEY} attributeName The attribute name that identifies the
     *                               queried value.
     * @return {KV[KEY]|undefined} The queried attribute value.
     *
     * @public
     */
    getAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapGet(this, attributeName)
      );
    }
    /**
     * Returns whether an attribute exists
     *
     * @param {string} attributeName The attribute name to check for existence.
     * @return {boolean} whether the attribute exists.
     *
     * @public
     */
    hasAttribute(attributeName) {
      return (
        /** @type {any} */
        typeMapHas(this, attributeName)
      );
    }
    /**
     * Returns all attribute name/value pairs in a JSON Object.
     *
     * @param {Snapshot} [snapshot]
     * @return {{ [Key in Extract<keyof KV,string>]?: KV[Key]}} A JSON Object that describes the attributes.
     *
     * @public
     */
    getAttributes(snapshot) {
      return (
        /** @type {any} */
        snapshot ? typeMapGetAllSnapshot(this, snapshot) : typeMapGetAll(this)
      );
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks={}] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Node} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const dom = _document.createElement(this.nodeName);
      const attrs = this.getAttributes();
      for (const key in attrs) {
        const value = attrs[key];
        if (typeof value === "string") {
          dom.setAttribute(key, value);
        }
      }
      typeListForEach(this, (yxml) => {
        dom.appendChild(yxml.toDOM(_document, hooks, binding));
      });
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlElementRefID);
      encoder.writeKey(this.nodeName);
    }
  };
  var readYXmlElement = (decoder) => new YXmlElement(decoder.readKey());
  var YXmlEvent = class extends YEvent {
    /**
     * @param {YXmlElement|YXmlText|YXmlFragment} target The target on which the event is created.
     * @param {Set<string|null>} subs The set of changed attributes. `null` is included if the
     *                   child list changed.
     * @param {Transaction} transaction The transaction instance with which the
     *                                  change was created.
     */
    constructor(target, subs, transaction) {
      super(target, transaction);
      this.childListChanged = false;
      this.attributesChanged = /* @__PURE__ */ new Set();
      subs.forEach((sub) => {
        if (sub === null) {
          this.childListChanged = true;
        } else {
          this.attributesChanged.add(sub);
        }
      });
    }
  };
  var YXmlHook = class _YXmlHook extends YMap {
    /**
     * @param {string} hookName nodeName of the Dom Node.
     */
    constructor(hookName) {
      super();
      this.hookName = hookName;
    }
    /**
     * Creates an Item with the same effect as this Item (without position effect)
     */
    _copy() {
      return new _YXmlHook(this.hookName);
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlHook}
     */
    clone() {
      const el = new _YXmlHook(this.hookName);
      this.forEach((value, key) => {
        el.set(key, value);
      });
      return el;
    }
    /**
     * Creates a Dom Element that mirrors this YXmlElement.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object.<string, any>} [hooks] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type
     * @return {Element} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks = {}, binding) {
      const hook = hooks[this.hookName];
      let dom;
      if (hook !== void 0) {
        dom = hook.createDom(this);
      } else {
        dom = document.createElement(this.hookName);
      }
      dom.setAttribute("data-yjs-hook", this.hookName);
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlHookRefID);
      encoder.writeKey(this.hookName);
    }
  };
  var readYXmlHook = (decoder) => new YXmlHook(decoder.readKey());
  var YXmlText = class _YXmlText extends YText {
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get nextSibling() {
      const n = this._item ? this._item.next : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    /**
     * @type {YXmlElement|YXmlText|null}
     */
    get prevSibling() {
      const n = this._item ? this._item.prev : null;
      return n ? (
        /** @type {YXmlElement|YXmlText} */
        /** @type {ContentType} */
        n.content.type
      ) : null;
    }
    _copy() {
      return new _YXmlText();
    }
    /**
     * Makes a copy of this data type that can be included somewhere else.
     *
     * Note that the content is only readable _after_ it has been included somewhere in the Ydoc.
     *
     * @return {YXmlText}
     */
    clone() {
      const text2 = new _YXmlText();
      text2.applyDelta(this.toDelta());
      return text2;
    }
    /**
     * Creates a Dom Element that mirrors this YXmlText.
     *
     * @param {Document} [_document=document] The document object (you must define
     *                                        this when calling this method in
     *                                        nodejs)
     * @param {Object<string, any>} [hooks] Optional property to customize how hooks
     *                                             are presented in the DOM
     * @param {any} [binding] You should not set this property. This is
     *                               used if DomBinding wants to create a
     *                               association to the created DOM type.
     * @return {Text} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
     *
     * @public
     */
    toDOM(_document = document, hooks, binding) {
      const dom = _document.createTextNode(this.toString());
      if (binding !== void 0) {
        binding._createAssociation(dom, this);
      }
      return dom;
    }
    toString() {
      return this.toDelta().map((delta) => {
        const nestedNodes = [];
        for (const nodeName in delta.attributes) {
          const attrs = [];
          for (const key in delta.attributes[nodeName]) {
            attrs.push({ key, value: delta.attributes[nodeName][key] });
          }
          attrs.sort((a, b) => a.key < b.key ? -1 : 1);
          nestedNodes.push({ nodeName, attrs });
        }
        nestedNodes.sort((a, b) => a.nodeName < b.nodeName ? -1 : 1);
        let str = "";
        for (let i = 0; i < nestedNodes.length; i++) {
          const node = nestedNodes[i];
          str += `<${node.nodeName}`;
          for (let j = 0; j < node.attrs.length; j++) {
            const attr = node.attrs[j];
            str += ` ${attr.key}="${attr.value}"`;
          }
          str += ">";
        }
        str += delta.insert;
        for (let i = nestedNodes.length - 1; i >= 0; i--) {
          str += `</${nestedNodes[i].nodeName}>`;
        }
        return str;
      }).join("");
    }
    /**
     * @return {string}
     */
    toJSON() {
      return this.toString();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     */
    _write(encoder) {
      encoder.writeTypeRef(YXmlTextRefID);
    }
  };
  var readYXmlText = (decoder) => new YXmlText();
  var AbstractStruct = class {
    /**
     * @param {ID} id
     * @param {number} length
     */
    constructor(id2, length3) {
      this.id = id2;
      this.length = length3;
    }
    /**
     * @type {boolean}
     */
    get deleted() {
      throw methodUnimplemented();
    }
    /**
     * Merge this struct with the item to the right.
     * This method is already assuming that `this.id.clock + this.length === this.id.clock`.
     * Also this method does *not* remove right from StructStore!
     * @param {AbstractStruct} right
     * @return {boolean} whether this merged with right
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     * @param {number} offset
     * @param {number} encodingRef
     */
    write(encoder, offset, encodingRef) {
      throw methodUnimplemented();
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      throw methodUnimplemented();
    }
  };
  var structGCRefNumber = 0;
  var GC = class extends AbstractStruct {
    get deleted() {
      return true;
    }
    delete() {
    }
    /**
     * @param {GC} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor !== right.constructor) {
        return false;
      }
      this.length += right.length;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      if (offset > 0) {
        this.id.clock += offset;
        this.length -= offset;
      }
      addStruct(transaction.doc.store, this);
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeInfo(structGCRefNumber);
      encoder.writeLen(this.length - offset);
    }
    /**
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      return null;
    }
  };
  var ContentBinary = class _ContentBinary {
    /**
     * @param {Uint8Array} content
     */
    constructor(content) {
      this.content = content;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.content];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentBinary}
     */
    copy() {
      return new _ContentBinary(this.content);
    }
    /**
     * @param {number} offset
     * @return {ContentBinary}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentBinary} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeBuf(this.content);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 3;
    }
  };
  var readContentBinary = (decoder) => new ContentBinary(decoder.readBuf());
  var ContentDeleted = class _ContentDeleted {
    /**
     * @param {number} len
     */
    constructor(len) {
      this.len = len;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.len;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return false;
    }
    /**
     * @return {ContentDeleted}
     */
    copy() {
      return new _ContentDeleted(this.len);
    }
    /**
     * @param {number} offset
     * @return {ContentDeleted}
     */
    splice(offset) {
      const right = new _ContentDeleted(this.len - offset);
      this.len = offset;
      return right;
    }
    /**
     * @param {ContentDeleted} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.len += right.len;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      addToDeleteSet(transaction.deleteSet, item.id.client, item.id.clock, this.len);
      item.markDeleted();
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeLen(this.len - offset);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 1;
    }
  };
  var readContentDeleted = (decoder) => new ContentDeleted(decoder.readLen());
  var createDocFromOpts = (guid, opts) => new Doc({ guid, ...opts, shouldLoad: opts.shouldLoad || opts.autoLoad || false });
  var ContentDoc = class _ContentDoc {
    /**
     * @param {Doc} doc
     */
    constructor(doc2) {
      if (doc2._item) {
        console.error("This document was already integrated as a sub-document. You should create a second instance instead with the same guid.");
      }
      this.doc = doc2;
      const opts = {};
      this.opts = opts;
      if (!doc2.gc) {
        opts.gc = false;
      }
      if (doc2.autoLoad) {
        opts.autoLoad = true;
      }
      if (doc2.meta !== null) {
        opts.meta = doc2.meta;
      }
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.doc];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentDoc}
     */
    copy() {
      return new _ContentDoc(createDocFromOpts(this.doc.guid, this.opts));
    }
    /**
     * @param {number} offset
     * @return {ContentDoc}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentDoc} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      this.doc._item = item;
      transaction.subdocsAdded.add(this.doc);
      if (this.doc.shouldLoad) {
        transaction.subdocsLoaded.add(this.doc);
      }
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
      if (transaction.subdocsAdded.has(this.doc)) {
        transaction.subdocsAdded.delete(this.doc);
      } else {
        transaction.subdocsRemoved.add(this.doc);
      }
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeString(this.doc.guid);
      encoder.writeAny(this.opts);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 9;
    }
  };
  var readContentDoc = (decoder) => new ContentDoc(createDocFromOpts(decoder.readString(), decoder.readAny()));
  var ContentEmbed = class _ContentEmbed {
    /**
     * @param {Object} embed
     */
    constructor(embed) {
      this.embed = embed;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.embed];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentEmbed}
     */
    copy() {
      return new _ContentEmbed(this.embed);
    }
    /**
     * @param {number} offset
     * @return {ContentEmbed}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentEmbed} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeJSON(this.embed);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 5;
    }
  };
  var readContentEmbed = (decoder) => new ContentEmbed(decoder.readJSON());
  var ContentFormat = class _ContentFormat {
    /**
     * @param {string} key
     * @param {Object} value
     */
    constructor(key, value) {
      this.key = key;
      this.value = value;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return false;
    }
    /**
     * @return {ContentFormat}
     */
    copy() {
      return new _ContentFormat(this.key, this.value);
    }
    /**
     * @param {number} _offset
     * @return {ContentFormat}
     */
    splice(_offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentFormat} _right
     * @return {boolean}
     */
    mergeWith(_right) {
      return false;
    }
    /**
     * @param {Transaction} _transaction
     * @param {Item} item
     */
    integrate(_transaction, item) {
      const p = (
        /** @type {YText} */
        item.parent
      );
      p._searchMarker = null;
      p._hasFormatting = true;
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeKey(this.key);
      encoder.writeJSON(this.value);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 6;
    }
  };
  var readContentFormat = (decoder) => new ContentFormat(decoder.readKey(), decoder.readJSON());
  var ContentJSON = class _ContentJSON {
    /**
     * @param {Array<any>} arr
     */
    constructor(arr) {
      this.arr = arr;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.arr.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.arr;
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentJSON}
     */
    copy() {
      return new _ContentJSON(this.arr);
    }
    /**
     * @param {number} offset
     * @return {ContentJSON}
     */
    splice(offset) {
      const right = new _ContentJSON(this.arr.slice(offset));
      this.arr = this.arr.slice(0, offset);
      return right;
    }
    /**
     * @param {ContentJSON} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.arr = this.arr.concat(right.arr);
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      const len = this.arr.length;
      encoder.writeLen(len - offset);
      for (let i = offset; i < len; i++) {
        const c = this.arr[i];
        encoder.writeString(c === void 0 ? "undefined" : JSON.stringify(c));
      }
    }
    /**
     * @return {number}
     */
    getRef() {
      return 2;
    }
  };
  var readContentJSON = (decoder) => {
    const len = decoder.readLen();
    const cs = [];
    for (let i = 0; i < len; i++) {
      const c = decoder.readString();
      if (c === "undefined") {
        cs.push(void 0);
      } else {
        cs.push(JSON.parse(c));
      }
    }
    return new ContentJSON(cs);
  };
  var isDevMode = getVariable("node_env") === "development";
  var ContentAny = class _ContentAny {
    /**
     * @param {Array<any>} arr
     */
    constructor(arr) {
      this.arr = arr;
      isDevMode && deepFreeze(arr);
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.arr.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.arr;
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentAny}
     */
    copy() {
      return new _ContentAny(this.arr);
    }
    /**
     * @param {number} offset
     * @return {ContentAny}
     */
    splice(offset) {
      const right = new _ContentAny(this.arr.slice(offset));
      this.arr = this.arr.slice(0, offset);
      return right;
    }
    /**
     * @param {ContentAny} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.arr = this.arr.concat(right.arr);
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      const len = this.arr.length;
      encoder.writeLen(len - offset);
      for (let i = offset; i < len; i++) {
        const c = this.arr[i];
        encoder.writeAny(c);
      }
    }
    /**
     * @return {number}
     */
    getRef() {
      return 8;
    }
  };
  var readContentAny = (decoder) => {
    const len = decoder.readLen();
    const cs = [];
    for (let i = 0; i < len; i++) {
      cs.push(decoder.readAny());
    }
    return new ContentAny(cs);
  };
  var ContentString = class _ContentString {
    /**
     * @param {string} str
     */
    constructor(str) {
      this.str = str;
    }
    /**
     * @return {number}
     */
    getLength() {
      return this.str.length;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return this.str.split("");
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentString}
     */
    copy() {
      return new _ContentString(this.str);
    }
    /**
     * @param {number} offset
     * @return {ContentString}
     */
    splice(offset) {
      const right = new _ContentString(this.str.slice(offset));
      this.str = this.str.slice(0, offset);
      const firstCharCode = this.str.charCodeAt(offset - 1);
      if (firstCharCode >= 55296 && firstCharCode <= 56319) {
        this.str = this.str.slice(0, offset - 1) + "\uFFFD";
        right.str = "\uFFFD" + right.str.slice(1);
      }
      return right;
    }
    /**
     * @param {ContentString} right
     * @return {boolean}
     */
    mergeWith(right) {
      this.str += right.str;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeString(offset === 0 ? this.str : this.str.slice(offset));
    }
    /**
     * @return {number}
     */
    getRef() {
      return 4;
    }
  };
  var readContentString = (decoder) => new ContentString(decoder.readString());
  var typeRefs = [
    readYArray,
    readYMap,
    readYText,
    readYXmlElement,
    readYXmlFragment,
    readYXmlHook,
    readYXmlText
  ];
  var YArrayRefID = 0;
  var YMapRefID = 1;
  var YTextRefID = 2;
  var YXmlElementRefID = 3;
  var YXmlFragmentRefID = 4;
  var YXmlHookRefID = 5;
  var YXmlTextRefID = 6;
  var ContentType = class _ContentType {
    /**
     * @param {AbstractType<any>} type
     */
    constructor(type) {
      this.type = type;
    }
    /**
     * @return {number}
     */
    getLength() {
      return 1;
    }
    /**
     * @return {Array<any>}
     */
    getContent() {
      return [this.type];
    }
    /**
     * @return {boolean}
     */
    isCountable() {
      return true;
    }
    /**
     * @return {ContentType}
     */
    copy() {
      return new _ContentType(this.type._copy());
    }
    /**
     * @param {number} offset
     * @return {ContentType}
     */
    splice(offset) {
      throw methodUnimplemented();
    }
    /**
     * @param {ContentType} right
     * @return {boolean}
     */
    mergeWith(right) {
      return false;
    }
    /**
     * @param {Transaction} transaction
     * @param {Item} item
     */
    integrate(transaction, item) {
      this.type._integrate(transaction.doc, item);
    }
    /**
     * @param {Transaction} transaction
     */
    delete(transaction) {
      let item = this.type._start;
      while (item !== null) {
        if (!item.deleted) {
          item.delete(transaction);
        } else if (item.id.clock < (transaction.beforeState.get(item.id.client) || 0)) {
          transaction._mergeStructs.push(item);
        }
        item = item.right;
      }
      this.type._map.forEach((item2) => {
        if (!item2.deleted) {
          item2.delete(transaction);
        } else if (item2.id.clock < (transaction.beforeState.get(item2.id.client) || 0)) {
          transaction._mergeStructs.push(item2);
        }
      });
      transaction.changed.delete(this.type);
    }
    /**
     * @param {StructStore} store
     */
    gc(store) {
      let item = this.type._start;
      while (item !== null) {
        item.gc(store, true);
        item = item.right;
      }
      this.type._start = null;
      this.type._map.forEach(
        /** @param {Item | null} item */
        (item2) => {
          while (item2 !== null) {
            item2.gc(store, true);
            item2 = item2.left;
          }
        }
      );
      this.type._map = /* @__PURE__ */ new Map();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      this.type._write(encoder);
    }
    /**
     * @return {number}
     */
    getRef() {
      return 7;
    }
  };
  var readContentType = (decoder) => new ContentType(typeRefs[decoder.readTypeRef()](decoder));
  var splitItem = (transaction, leftItem, diff) => {
    const { client, clock } = leftItem.id;
    const rightItem = new Item(
      createID(client, clock + diff),
      leftItem,
      createID(client, clock + diff - 1),
      leftItem.right,
      leftItem.rightOrigin,
      leftItem.parent,
      leftItem.parentSub,
      leftItem.content.splice(diff)
    );
    if (leftItem.deleted) {
      rightItem.markDeleted();
    }
    if (leftItem.keep) {
      rightItem.keep = true;
    }
    if (leftItem.redone !== null) {
      rightItem.redone = createID(leftItem.redone.client, leftItem.redone.clock + diff);
    }
    leftItem.right = rightItem;
    if (rightItem.right !== null) {
      rightItem.right.left = rightItem;
    }
    transaction._mergeStructs.push(rightItem);
    if (rightItem.parentSub !== null && rightItem.right === null) {
      rightItem.parent._map.set(rightItem.parentSub, rightItem);
    }
    leftItem.length = diff;
    return rightItem;
  };
  var Item = class _Item extends AbstractStruct {
    /**
     * @param {ID} id
     * @param {Item | null} left
     * @param {ID | null} origin
     * @param {Item | null} right
     * @param {ID | null} rightOrigin
     * @param {AbstractType<any>|ID|null} parent Is a type if integrated, is null if it is possible to copy parent from left or right, is ID before integration to search for it.
     * @param {string | null} parentSub
     * @param {AbstractContent} content
     */
    constructor(id2, left, origin, right, rightOrigin, parent, parentSub, content) {
      super(id2, content.getLength());
      this.origin = origin;
      this.left = left;
      this.right = right;
      this.rightOrigin = rightOrigin;
      this.parent = parent;
      this.parentSub = parentSub;
      this.redone = null;
      this.content = content;
      this.info = this.content.isCountable() ? BIT2 : 0;
    }
    /**
     * This is used to mark the item as an indexed fast-search marker
     *
     * @type {boolean}
     */
    set marker(isMarked) {
      if ((this.info & BIT4) > 0 !== isMarked) {
        this.info ^= BIT4;
      }
    }
    get marker() {
      return (this.info & BIT4) > 0;
    }
    /**
     * If true, do not garbage collect this Item.
     */
    get keep() {
      return (this.info & BIT1) > 0;
    }
    set keep(doKeep) {
      if (this.keep !== doKeep) {
        this.info ^= BIT1;
      }
    }
    get countable() {
      return (this.info & BIT2) > 0;
    }
    /**
     * Whether this item was deleted or not.
     * @type {Boolean}
     */
    get deleted() {
      return (this.info & BIT3) > 0;
    }
    set deleted(doDelete) {
      if (this.deleted !== doDelete) {
        this.info ^= BIT3;
      }
    }
    markDeleted() {
      this.info |= BIT3;
    }
    /**
     * Return the creator clientID of the missing op or define missing items and return null.
     *
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      if (this.origin && this.origin.client !== this.id.client && this.origin.clock >= getState(store, this.origin.client)) {
        return this.origin.client;
      }
      if (this.rightOrigin && this.rightOrigin.client !== this.id.client && this.rightOrigin.clock >= getState(store, this.rightOrigin.client)) {
        return this.rightOrigin.client;
      }
      if (this.parent && this.parent.constructor === ID && this.id.client !== this.parent.client && this.parent.clock >= getState(store, this.parent.client)) {
        return this.parent.client;
      }
      if (this.origin) {
        this.left = getItemCleanEnd(transaction, store, this.origin);
        this.origin = this.left.lastId;
      }
      if (this.rightOrigin) {
        this.right = getItemCleanStart(transaction, this.rightOrigin);
        this.rightOrigin = this.right.id;
      }
      if (this.left && this.left.constructor === GC || this.right && this.right.constructor === GC) {
        this.parent = null;
      } else if (!this.parent) {
        if (this.left && this.left.constructor === _Item) {
          this.parent = this.left.parent;
          this.parentSub = this.left.parentSub;
        } else if (this.right && this.right.constructor === _Item) {
          this.parent = this.right.parent;
          this.parentSub = this.right.parentSub;
        }
      } else if (this.parent.constructor === ID) {
        const parentItem = getItem(store, this.parent);
        if (parentItem.constructor === GC) {
          this.parent = null;
        } else {
          this.parent = /** @type {ContentType} */
          parentItem.content.type;
        }
      }
      return null;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      if (offset > 0) {
        this.id.clock += offset;
        this.left = getItemCleanEnd(transaction, transaction.doc.store, createID(this.id.client, this.id.clock - 1));
        this.origin = this.left.lastId;
        this.content = this.content.splice(offset);
        this.length -= offset;
      }
      if (this.parent) {
        if (!this.left && (!this.right || this.right.left !== null) || this.left && this.left.right !== this.right) {
          let left = this.left;
          let o;
          if (left !== null) {
            o = left.right;
          } else if (this.parentSub !== null) {
            o = /** @type {AbstractType<any>} */
            this.parent._map.get(this.parentSub) || null;
            while (o !== null && o.left !== null) {
              o = o.left;
            }
          } else {
            o = /** @type {AbstractType<any>} */
            this.parent._start;
          }
          const conflictingItems = /* @__PURE__ */ new Set();
          const itemsBeforeOrigin = /* @__PURE__ */ new Set();
          while (o !== null && o !== this.right) {
            itemsBeforeOrigin.add(o);
            conflictingItems.add(o);
            if (compareIDs(this.origin, o.origin)) {
              if (o.id.client < this.id.client) {
                left = o;
                conflictingItems.clear();
              } else if (compareIDs(this.rightOrigin, o.rightOrigin)) {
                break;
              }
            } else if (o.origin !== null && itemsBeforeOrigin.has(getItem(transaction.doc.store, o.origin))) {
              if (!conflictingItems.has(getItem(transaction.doc.store, o.origin))) {
                left = o;
                conflictingItems.clear();
              }
            } else {
              break;
            }
            o = o.right;
          }
          this.left = left;
        }
        if (this.left !== null) {
          const right = this.left.right;
          this.right = right;
          this.left.right = this;
        } else {
          let r;
          if (this.parentSub !== null) {
            r = /** @type {AbstractType<any>} */
            this.parent._map.get(this.parentSub) || null;
            while (r !== null && r.left !== null) {
              r = r.left;
            }
          } else {
            r = /** @type {AbstractType<any>} */
            this.parent._start;
            this.parent._start = this;
          }
          this.right = r;
        }
        if (this.right !== null) {
          this.right.left = this;
        } else if (this.parentSub !== null) {
          this.parent._map.set(this.parentSub, this);
          if (this.left !== null) {
            this.left.delete(transaction);
          }
        }
        if (this.parentSub === null && this.countable && !this.deleted) {
          this.parent._length += this.length;
        }
        addStruct(transaction.doc.store, this);
        this.content.integrate(transaction, this);
        addChangedTypeToTransaction(
          transaction,
          /** @type {AbstractType<any>} */
          this.parent,
          this.parentSub
        );
        if (
          /** @type {AbstractType<any>} */
          this.parent._item !== null && /** @type {AbstractType<any>} */
          this.parent._item.deleted || this.parentSub !== null && this.right !== null
        ) {
          this.delete(transaction);
        }
      } else {
        new GC(this.id, this.length).integrate(transaction, 0);
      }
    }
    /**
     * Returns the next non-deleted item
     */
    get next() {
      let n = this.right;
      while (n !== null && n.deleted) {
        n = n.right;
      }
      return n;
    }
    /**
     * Returns the previous non-deleted item
     */
    get prev() {
      let n = this.left;
      while (n !== null && n.deleted) {
        n = n.left;
      }
      return n;
    }
    /**
     * Computes the last content address of this Item.
     */
    get lastId() {
      return this.length === 1 ? this.id : createID(this.id.client, this.id.clock + this.length - 1);
    }
    /**
     * Try to merge two items
     *
     * @param {Item} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor === right.constructor && compareIDs(right.origin, this.lastId) && this.right === right && compareIDs(this.rightOrigin, right.rightOrigin) && this.id.client === right.id.client && this.id.clock + this.length === right.id.clock && this.deleted === right.deleted && this.redone === null && right.redone === null && this.content.constructor === right.content.constructor && this.content.mergeWith(right.content)) {
        const searchMarker = (
          /** @type {AbstractType<any>} */
          this.parent._searchMarker
        );
        if (searchMarker) {
          searchMarker.forEach((marker) => {
            if (marker.p === right) {
              marker.p = this;
              if (!this.deleted && this.countable) {
                marker.index -= this.length;
              }
            }
          });
        }
        if (right.keep) {
          this.keep = true;
        }
        this.right = right.right;
        if (this.right !== null) {
          this.right.left = this;
        }
        this.length += right.length;
        return true;
      }
      return false;
    }
    /**
     * Mark this Item as deleted.
     *
     * @param {Transaction} transaction
     */
    delete(transaction) {
      if (!this.deleted) {
        const parent = (
          /** @type {AbstractType<any>} */
          this.parent
        );
        if (this.countable && this.parentSub === null) {
          parent._length -= this.length;
        }
        this.markDeleted();
        addToDeleteSet(transaction.deleteSet, this.id.client, this.id.clock, this.length);
        addChangedTypeToTransaction(transaction, parent, this.parentSub);
        this.content.delete(transaction);
      }
    }
    /**
     * @param {StructStore} store
     * @param {boolean} parentGCd
     */
    gc(store, parentGCd) {
      if (!this.deleted) {
        throw unexpectedCase();
      }
      this.content.gc(store);
      if (parentGCd) {
        replaceStruct(store, this, new GC(this.id, this.length));
      } else {
        this.content = new ContentDeleted(this.length);
      }
    }
    /**
     * Transform the properties of this type to binary and write it to an
     * BinaryEncoder.
     *
     * This is called when this Item is sent to a remote peer.
     *
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder The encoder to write data to.
     * @param {number} offset
     */
    write(encoder, offset) {
      const origin = offset > 0 ? createID(this.id.client, this.id.clock + offset - 1) : this.origin;
      const rightOrigin = this.rightOrigin;
      const parentSub = this.parentSub;
      const info = this.content.getRef() & BITS5 | (origin === null ? 0 : BIT8) | // origin is defined
      (rightOrigin === null ? 0 : BIT7) | // right origin is defined
      (parentSub === null ? 0 : BIT6);
      encoder.writeInfo(info);
      if (origin !== null) {
        encoder.writeLeftID(origin);
      }
      if (rightOrigin !== null) {
        encoder.writeRightID(rightOrigin);
      }
      if (origin === null && rightOrigin === null) {
        const parent = (
          /** @type {AbstractType<any>} */
          this.parent
        );
        if (parent._item !== void 0) {
          const parentItem = parent._item;
          if (parentItem === null) {
            const ykey = findRootTypeKey(parent);
            encoder.writeParentInfo(true);
            encoder.writeString(ykey);
          } else {
            encoder.writeParentInfo(false);
            encoder.writeLeftID(parentItem.id);
          }
        } else if (parent.constructor === String) {
          encoder.writeParentInfo(true);
          encoder.writeString(parent);
        } else if (parent.constructor === ID) {
          encoder.writeParentInfo(false);
          encoder.writeLeftID(parent);
        } else {
          unexpectedCase();
        }
        if (parentSub !== null) {
          encoder.writeString(parentSub);
        }
      }
      this.content.write(encoder, offset);
    }
  };
  var readItemContent = (decoder, info) => contentRefs[info & BITS5](decoder);
  var contentRefs = [
    () => {
      unexpectedCase();
    },
    // GC is not ItemContent
    readContentDeleted,
    // 1
    readContentJSON,
    // 2
    readContentBinary,
    // 3
    readContentString,
    // 4
    readContentEmbed,
    // 5
    readContentFormat,
    // 6
    readContentType,
    // 7
    readContentAny,
    // 8
    readContentDoc,
    // 9
    () => {
      unexpectedCase();
    }
    // 10 - Skip is not ItemContent
  ];
  var structSkipRefNumber = 10;
  var Skip = class extends AbstractStruct {
    get deleted() {
      return true;
    }
    delete() {
    }
    /**
     * @param {Skip} right
     * @return {boolean}
     */
    mergeWith(right) {
      if (this.constructor !== right.constructor) {
        return false;
      }
      this.length += right.length;
      return true;
    }
    /**
     * @param {Transaction} transaction
     * @param {number} offset
     */
    integrate(transaction, offset) {
      unexpectedCase();
    }
    /**
     * @param {UpdateEncoderV1 | UpdateEncoderV2} encoder
     * @param {number} offset
     */
    write(encoder, offset) {
      encoder.writeInfo(structSkipRefNumber);
      writeVarUint(encoder.restEncoder, this.length - offset);
    }
    /**
     * @param {Transaction} transaction
     * @param {StructStore} store
     * @return {null | number}
     */
    getMissing(transaction, store) {
      return null;
    }
  };
  var glo = (
    /** @type {any} */
    typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {}
  );
  var importIdentifier = "__ $YJS$ __";
  if (glo[importIdentifier] === true) {
    console.error("Yjs was already imported. This breaks constructor checks and will lead to issues! - https://github.com/yjs/yjs/issues/438");
  }
  glo[importIdentifier] = true;

  // node_modules/@hocuspocus/common/dist/hocuspocus-common.esm.js
  var floor2 = Math.floor;
  var min2 = (a, b) => a < b ? a : b;
  var max2 = (a, b) => a > b ? a : b;
  var BIT82 = 128;
  var BITS72 = 127;
  var MAX_SAFE_INTEGER2 = Number.MAX_SAFE_INTEGER;
  var _encodeUtf8Polyfill2 = (str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = /** @type {number} */
      encodedString.codePointAt(i);
    }
    return buf;
  };
  var utf8TextEncoder2 = (
    /** @type {TextEncoder} */
    typeof TextEncoder !== "undefined" ? new TextEncoder() : null
  );
  var _encodeUtf8Native2 = (str) => utf8TextEncoder2.encode(str);
  var encodeUtf82 = utf8TextEncoder2 ? _encodeUtf8Native2 : _encodeUtf8Polyfill2;
  var utf8TextDecoder2 = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  if (utf8TextDecoder2 && utf8TextDecoder2.decode(new Uint8Array()).length === 1) {
    utf8TextDecoder2 = null;
  }
  var write2 = (encoder, num) => {
    const bufferLen = encoder.cbuf.length;
    if (encoder.cpos === bufferLen) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(bufferLen * 2);
      encoder.cpos = 0;
    }
    encoder.cbuf[encoder.cpos++] = num;
  };
  var writeVarUint2 = (encoder, num) => {
    while (num > BITS72) {
      write2(encoder, BIT82 | BITS72 & num);
      num = floor2(num / 128);
    }
    write2(encoder, BITS72 & num);
  };
  var _strBuffer2 = new Uint8Array(3e4);
  var _maxStrBSize2 = _strBuffer2.length / 3;
  var _writeVarStringNative2 = (encoder, str) => {
    if (str.length < _maxStrBSize2) {
      const written = utf8TextEncoder2.encodeInto(str, _strBuffer2).written || 0;
      writeVarUint2(encoder, written);
      for (let i = 0; i < written; i++) {
        write2(encoder, _strBuffer2[i]);
      }
    } else {
      writeVarUint8Array2(encoder, encodeUtf82(str));
    }
  };
  var _writeVarStringPolyfill2 = (encoder, str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    writeVarUint2(encoder, len);
    for (let i = 0; i < len; i++) {
      write2(
        encoder,
        /** @type {number} */
        encodedString.codePointAt(i)
      );
    }
  };
  var writeVarString2 = utf8TextEncoder2 && /** @type {any} */
  utf8TextEncoder2.encodeInto ? _writeVarStringNative2 : _writeVarStringPolyfill2;
  var writeUint8Array2 = (encoder, uint8Array) => {
    const bufferLen = encoder.cbuf.length;
    const cpos = encoder.cpos;
    const leftCopyLen = min2(bufferLen - cpos, uint8Array.length);
    const rightCopyLen = uint8Array.length - leftCopyLen;
    encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
    encoder.cpos += leftCopyLen;
    if (rightCopyLen > 0) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(max2(bufferLen * 2, rightCopyLen));
      encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
      encoder.cpos = rightCopyLen;
    }
  };
  var writeVarUint8Array2 = (encoder, uint8Array) => {
    writeVarUint2(encoder, uint8Array.byteLength);
    writeUint8Array2(encoder, uint8Array);
  };
  var create7 = (s) => new Error(s);
  var errorUnexpectedEndOfArray2 = create7("Unexpected end of array");
  var errorIntegerOutOfRange2 = create7("Integer out of Range");
  var readUint8Array2 = (decoder, len) => {
    const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
    decoder.pos += len;
    return view;
  };
  var readVarUint8Array2 = (decoder) => readUint8Array2(decoder, readVarUint2(decoder));
  var readUint82 = (decoder) => decoder.arr[decoder.pos++];
  var readVarUint2 = (decoder) => {
    let num = 0;
    let mult = 1;
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      const r = decoder.arr[decoder.pos++];
      num = num + (r & BITS72) * mult;
      mult *= 128;
      if (r < BIT82) {
        return num;
      }
      if (num > MAX_SAFE_INTEGER2) {
        throw errorIntegerOutOfRange2;
      }
    }
    throw errorUnexpectedEndOfArray2;
  };
  var _readVarStringPolyfill2 = (decoder) => {
    let remainingLen = readVarUint2(decoder);
    if (remainingLen === 0) {
      return "";
    } else {
      let encodedString = String.fromCodePoint(readUint82(decoder));
      if (--remainingLen < 100) {
        while (remainingLen--) {
          encodedString += String.fromCodePoint(readUint82(decoder));
        }
      } else {
        while (remainingLen > 0) {
          const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
          const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
          decoder.pos += nextLen;
          encodedString += String.fromCodePoint.apply(
            null,
            /** @type {any} */
            bytes
          );
          remainingLen -= nextLen;
        }
      }
      return decodeURIComponent(escape(encodedString));
    }
  };
  var _readVarStringNative2 = (decoder) => (
    /** @type any */
    utf8TextDecoder2.decode(readVarUint8Array2(decoder))
  );
  var readVarString2 = utf8TextDecoder2 ? _readVarStringNative2 : _readVarStringPolyfill2;
  var AuthMessageType;
  (function(AuthMessageType2) {
    AuthMessageType2[AuthMessageType2["Token"] = 0] = "Token";
    AuthMessageType2[AuthMessageType2["PermissionDenied"] = 1] = "PermissionDenied";
    AuthMessageType2[AuthMessageType2["Authenticated"] = 2] = "Authenticated";
  })(AuthMessageType || (AuthMessageType = {}));
  var writeAuthentication = (encoder, auth) => {
    writeVarUint2(encoder, AuthMessageType.Token);
    writeVarString2(encoder, auth);
  };
  var readAuthMessage = (decoder, sendToken, permissionDeniedHandler, authenticatedHandler) => {
    switch (readVarUint2(decoder)) {
      case AuthMessageType.Token: {
        sendToken();
        break;
      }
      case AuthMessageType.PermissionDenied: {
        permissionDeniedHandler(readVarString2(decoder));
        break;
      }
      case AuthMessageType.Authenticated: {
        authenticatedHandler(readVarString2(decoder));
        break;
      }
    }
  };
  var awarenessStatesToArray = (states) => {
    return Array.from(states.entries()).map(([key, value]) => {
      return {
        clientId: key,
        ...value
      };
    });
  };
  var WsReadyStates;
  (function(WsReadyStates2) {
    WsReadyStates2[WsReadyStates2["Connecting"] = 0] = "Connecting";
    WsReadyStates2[WsReadyStates2["Open"] = 1] = "Open";
    WsReadyStates2[WsReadyStates2["Closing"] = 2] = "Closing";
    WsReadyStates2[WsReadyStates2["Closed"] = 3] = "Closed";
  })(WsReadyStates || (WsReadyStates = {}));

  // node_modules/@lifeomic/attempt/dist/es6/src/index.js
  function applyDefaults(options) {
    if (!options) {
      options = {};
    }
    return {
      delay: options.delay === void 0 ? 200 : options.delay,
      initialDelay: options.initialDelay === void 0 ? 0 : options.initialDelay,
      minDelay: options.minDelay === void 0 ? 0 : options.minDelay,
      maxDelay: options.maxDelay === void 0 ? 0 : options.maxDelay,
      factor: options.factor === void 0 ? 0 : options.factor,
      maxAttempts: options.maxAttempts === void 0 ? 3 : options.maxAttempts,
      timeout: options.timeout === void 0 ? 0 : options.timeout,
      jitter: options.jitter === true,
      initialJitter: options.initialJitter === true,
      handleError: options.handleError === void 0 ? null : options.handleError,
      handleTimeout: options.handleTimeout === void 0 ? null : options.handleTimeout,
      beforeAttempt: options.beforeAttempt === void 0 ? null : options.beforeAttempt,
      calculateDelay: options.calculateDelay === void 0 ? null : options.calculateDelay
    };
  }
  async function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
  function defaultCalculateDelay(context, options) {
    let delay = options.delay;
    if (delay === 0) {
      return 0;
    }
    if (options.factor) {
      delay *= Math.pow(options.factor, context.attemptNum - 1);
      if (options.maxDelay !== 0) {
        delay = Math.min(delay, options.maxDelay);
      }
    }
    if (options.jitter) {
      const min4 = Math.ceil(options.minDelay);
      const max4 = Math.floor(delay);
      delay = Math.floor(Math.random() * (max4 - min4 + 1)) + min4;
    }
    return Math.round(delay);
  }
  async function retry(attemptFunc, attemptOptions) {
    const options = applyDefaults(attemptOptions);
    for (const prop of [
      "delay",
      "initialDelay",
      "minDelay",
      "maxDelay",
      "maxAttempts",
      "timeout"
    ]) {
      const value = options[prop];
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Value for ${prop} must be an integer greater than or equal to 0`);
      }
    }
    if (options.factor.constructor !== Number || options.factor < 0) {
      throw new Error(`Value for factor must be a number greater than or equal to 0`);
    }
    if (options.delay < options.minDelay) {
      throw new Error(`delay cannot be less than minDelay (delay: ${options.delay}, minDelay: ${options.minDelay}`);
    }
    const context = {
      attemptNum: 0,
      attemptsRemaining: options.maxAttempts ? options.maxAttempts : -1,
      aborted: false,
      abort() {
        context.aborted = true;
      }
    };
    const calculateDelay = options.calculateDelay || defaultCalculateDelay;
    async function makeAttempt() {
      if (options.beforeAttempt) {
        options.beforeAttempt(context, options);
      }
      if (context.aborted) {
        const err = new Error(`Attempt aborted`);
        err.code = "ATTEMPT_ABORTED";
        throw err;
      }
      const onError = async (err) => {
        if (options.handleError) {
          await options.handleError(err, context, options);
        }
        if (context.aborted || context.attemptsRemaining === 0) {
          throw err;
        }
        context.attemptNum++;
        const delay = calculateDelay(context, options);
        if (delay) {
          await sleep(delay);
        }
        return makeAttempt();
      };
      if (context.attemptsRemaining > 0) {
        context.attemptsRemaining--;
      }
      if (options.timeout) {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            if (options.handleTimeout) {
              try {
                resolve(options.handleTimeout(context, options));
              } catch (e) {
                reject(e);
              }
            } else {
              const err = new Error(`Retry timeout (attemptNum: ${context.attemptNum}, timeout: ${options.timeout})`);
              err.code = "ATTEMPT_TIMEOUT";
              reject(err);
            }
          }, options.timeout);
          attemptFunc(context, options).then((result) => {
            clearTimeout(timer);
            resolve(result);
          }).catch((err) => {
            clearTimeout(timer);
            onError(err).then(resolve).catch(reject);
          });
        });
      } else {
        return attemptFunc(context, options).catch(onError);
      }
    }
    const initialDelay = options.calculateDelay ? options.calculateDelay(context, options) : options.initialDelay;
    if (initialDelay) {
      await sleep(initialDelay);
    }
    if (context.attemptNum < 1 && options.initialJitter) {
      const delay = calculateDelay(context, options);
      if (delay) {
        await sleep(delay);
      }
    }
    return makeAttempt();
  }

  // node_modules/@hocuspocus/provider/dist/hocuspocus-provider.esm.js
  var floor3 = Math.floor;
  var min3 = (a, b) => a < b ? a : b;
  var max3 = (a, b) => a > b ? a : b;
  var BIT72 = 64;
  var BIT83 = 128;
  var BITS62 = 63;
  var BITS73 = 127;
  var MAX_SAFE_INTEGER3 = Number.MAX_SAFE_INTEGER;
  var create$2 = () => /* @__PURE__ */ new Set();
  var from2 = Array.from;
  var _encodeUtf8Polyfill3 = (str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buf[i] = /** @type {number} */
      encodedString.codePointAt(i);
    }
    return buf;
  };
  var utf8TextEncoder3 = (
    /** @type {TextEncoder} */
    typeof TextEncoder !== "undefined" ? new TextEncoder() : null
  );
  var _encodeUtf8Native3 = (str) => utf8TextEncoder3.encode(str);
  var encodeUtf83 = utf8TextEncoder3 ? _encodeUtf8Native3 : _encodeUtf8Polyfill3;
  var utf8TextDecoder3 = typeof TextDecoder === "undefined" ? null : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  if (utf8TextDecoder3 && utf8TextDecoder3.decode(new Uint8Array()).length === 1) {
    utf8TextDecoder3 = null;
  }
  var Encoder2 = class {
    constructor() {
      this.cpos = 0;
      this.cbuf = new Uint8Array(100);
      this.bufs = [];
    }
  };
  var createEncoder2 = () => new Encoder2();
  var length$1 = (encoder) => {
    let len = encoder.cpos;
    for (let i = 0; i < encoder.bufs.length; i++) {
      len += encoder.bufs[i].length;
    }
    return len;
  };
  var toUint8Array2 = (encoder) => {
    const uint8arr = new Uint8Array(length$1(encoder));
    let curPos = 0;
    for (let i = 0; i < encoder.bufs.length; i++) {
      const d = encoder.bufs[i];
      uint8arr.set(d, curPos);
      curPos += d.length;
    }
    uint8arr.set(new Uint8Array(encoder.cbuf.buffer, 0, encoder.cpos), curPos);
    return uint8arr;
  };
  var write3 = (encoder, num) => {
    const bufferLen = encoder.cbuf.length;
    if (encoder.cpos === bufferLen) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(bufferLen * 2);
      encoder.cpos = 0;
    }
    encoder.cbuf[encoder.cpos++] = num;
  };
  var writeVarUint3 = (encoder, num) => {
    while (num > BITS73) {
      write3(encoder, BIT83 | BITS73 & num);
      num = floor3(num / 128);
    }
    write3(encoder, BITS73 & num);
  };
  var _strBuffer3 = new Uint8Array(3e4);
  var _maxStrBSize3 = _strBuffer3.length / 3;
  var _writeVarStringNative3 = (encoder, str) => {
    if (str.length < _maxStrBSize3) {
      const written = utf8TextEncoder3.encodeInto(str, _strBuffer3).written || 0;
      writeVarUint3(encoder, written);
      for (let i = 0; i < written; i++) {
        write3(encoder, _strBuffer3[i]);
      }
    } else {
      writeVarUint8Array3(encoder, encodeUtf83(str));
    }
  };
  var _writeVarStringPolyfill3 = (encoder, str) => {
    const encodedString = unescape(encodeURIComponent(str));
    const len = encodedString.length;
    writeVarUint3(encoder, len);
    for (let i = 0; i < len; i++) {
      write3(
        encoder,
        /** @type {number} */
        encodedString.codePointAt(i)
      );
    }
  };
  var writeVarString3 = utf8TextEncoder3 && /** @type {any} */
  utf8TextEncoder3.encodeInto ? _writeVarStringNative3 : _writeVarStringPolyfill3;
  var writeUint8Array3 = (encoder, uint8Array) => {
    const bufferLen = encoder.cbuf.length;
    const cpos = encoder.cpos;
    const leftCopyLen = min3(bufferLen - cpos, uint8Array.length);
    const rightCopyLen = uint8Array.length - leftCopyLen;
    encoder.cbuf.set(uint8Array.subarray(0, leftCopyLen), cpos);
    encoder.cpos += leftCopyLen;
    if (rightCopyLen > 0) {
      encoder.bufs.push(encoder.cbuf);
      encoder.cbuf = new Uint8Array(max3(bufferLen * 2, rightCopyLen));
      encoder.cbuf.set(uint8Array.subarray(leftCopyLen));
      encoder.cpos = rightCopyLen;
    }
  };
  var writeVarUint8Array3 = (encoder, uint8Array) => {
    writeVarUint3(encoder, uint8Array.byteLength);
    writeUint8Array3(encoder, uint8Array);
  };
  var create$1 = (s) => new Error(s);
  var errorUnexpectedEndOfArray3 = create$1("Unexpected end of array");
  var errorIntegerOutOfRange3 = create$1("Integer out of Range");
  var Decoder2 = class {
    /**
     * @param {Uint8Array} uint8Array Binary data to decode
     */
    constructor(uint8Array) {
      this.arr = uint8Array;
      this.pos = 0;
    }
  };
  var createDecoder2 = (uint8Array) => new Decoder2(uint8Array);
  var readUint8Array3 = (decoder, len) => {
    const view = new Uint8Array(decoder.arr.buffer, decoder.pos + decoder.arr.byteOffset, len);
    decoder.pos += len;
    return view;
  };
  var readVarUint8Array3 = (decoder) => readUint8Array3(decoder, readVarUint3(decoder));
  var readUint83 = (decoder) => decoder.arr[decoder.pos++];
  var readVarUint3 = (decoder) => {
    let num = 0;
    let mult = 1;
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      const r = decoder.arr[decoder.pos++];
      num = num + (r & BITS73) * mult;
      mult *= 128;
      if (r < BIT83) {
        return num;
      }
      if (num > MAX_SAFE_INTEGER3) {
        throw errorIntegerOutOfRange3;
      }
    }
    throw errorUnexpectedEndOfArray3;
  };
  var readVarInt2 = (decoder) => {
    let r = decoder.arr[decoder.pos++];
    let num = r & BITS62;
    let mult = 64;
    const sign = (r & BIT72) > 0 ? -1 : 1;
    if ((r & BIT83) === 0) {
      return sign * num;
    }
    const len = decoder.arr.length;
    while (decoder.pos < len) {
      r = decoder.arr[decoder.pos++];
      num = num + (r & BITS73) * mult;
      mult *= 128;
      if (r < BIT83) {
        return sign * num;
      }
      if (num > MAX_SAFE_INTEGER3) {
        throw errorIntegerOutOfRange3;
      }
    }
    throw errorUnexpectedEndOfArray3;
  };
  var _readVarStringPolyfill3 = (decoder) => {
    let remainingLen = readVarUint3(decoder);
    if (remainingLen === 0) {
      return "";
    } else {
      let encodedString = String.fromCodePoint(readUint83(decoder));
      if (--remainingLen < 100) {
        while (remainingLen--) {
          encodedString += String.fromCodePoint(readUint83(decoder));
        }
      } else {
        while (remainingLen > 0) {
          const nextLen = remainingLen < 1e4 ? remainingLen : 1e4;
          const bytes = decoder.arr.subarray(decoder.pos, decoder.pos + nextLen);
          decoder.pos += nextLen;
          encodedString += String.fromCodePoint.apply(
            null,
            /** @type {any} */
            bytes
          );
          remainingLen -= nextLen;
        }
      }
      return decodeURIComponent(escape(encodedString));
    }
  };
  var _readVarStringNative3 = (decoder) => (
    /** @type any */
    utf8TextDecoder3.decode(readVarUint8Array3(decoder))
  );
  var readVarString3 = utf8TextDecoder3 ? _readVarStringNative3 : _readVarStringPolyfill3;
  var peekVarString = (decoder) => {
    const pos = decoder.pos;
    const s = readVarString3(decoder);
    decoder.pos = pos;
    return s;
  };
  var getUnixTime2 = Date.now;
  var create8 = () => /* @__PURE__ */ new Map();
  var setIfUndefined2 = (map2, key, createT) => {
    let set = map2.get(key);
    if (set === void 0) {
      map2.set(key, set = createT());
    }
    return set;
  };
  var Observable = class {
    constructor() {
      this._observers = create8();
    }
    /**
     * @param {N} name
     * @param {function} f
     */
    on(name, f) {
      setIfUndefined2(this._observers, name, create$2).add(f);
    }
    /**
     * @param {N} name
     * @param {function} f
     */
    once(name, f) {
      const _f = (...args2) => {
        this.off(name, _f);
        f(...args2);
      };
      this.on(name, _f);
    }
    /**
     * @param {N} name
     * @param {function} f
     */
    off(name, f) {
      const observers = this._observers.get(name);
      if (observers !== void 0) {
        observers.delete(f);
        if (observers.size === 0) {
          this._observers.delete(name);
        }
      }
    }
    /**
     * Emit a named event. All registered event listeners that listen to the
     * specified name will receive the event.
     *
     * @todo This should catch exceptions
     *
     * @param {N} name The event name.
     * @param {Array<any>} args The arguments that are applied to the event listener.
     */
    emit(name, args2) {
      return from2((this._observers.get(name) || create8()).values()).forEach((f) => f(...args2));
    }
    destroy() {
      this._observers = create8();
    }
  };
  var keys2 = Object.keys;
  var length2 = (obj) => keys2(obj).length;
  var hasProperty2 = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  var equalityStrict = (a, b) => a === b;
  var equalityDeep2 = (a, b) => {
    if (a == null || b == null) {
      return equalityStrict(a, b);
    }
    if (a.constructor !== b.constructor) {
      return false;
    }
    if (a === b) {
      return true;
    }
    switch (a.constructor) {
      case ArrayBuffer:
        a = new Uint8Array(a);
        b = new Uint8Array(b);
      // eslint-disable-next-line no-fallthrough
      case Uint8Array: {
        if (a.byteLength !== b.byteLength) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        break;
      }
      case Set: {
        if (a.size !== b.size) {
          return false;
        }
        for (const value of a) {
          if (!b.has(value)) {
            return false;
          }
        }
        break;
      }
      case Map: {
        if (a.size !== b.size) {
          return false;
        }
        for (const key of a.keys()) {
          if (!b.has(key) || !equalityDeep2(a.get(key), b.get(key))) {
            return false;
          }
        }
        break;
      }
      case Object:
        if (length2(a) !== length2(b)) {
          return false;
        }
        for (const key in a) {
          if (!hasProperty2(a, key) || !equalityDeep2(a[key], b[key])) {
            return false;
          }
        }
        break;
      case Array:
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!equalityDeep2(a[i], b[i])) {
            return false;
          }
        }
        break;
      default:
        return false;
    }
    return true;
  };
  var outdatedTimeout = 3e4;
  var Awareness = class extends Observable {
    /**
     * @param {Y.Doc} doc
     */
    constructor(doc2) {
      super();
      this.doc = doc2;
      this.clientID = doc2.clientID;
      this.states = /* @__PURE__ */ new Map();
      this.meta = /* @__PURE__ */ new Map();
      this._checkInterval = /** @type {any} */
      setInterval(() => {
        const now = getUnixTime2();
        if (this.getLocalState() !== null && outdatedTimeout / 2 <= now - /** @type {{lastUpdated:number}} */
        this.meta.get(this.clientID).lastUpdated) {
          this.setLocalState(this.getLocalState());
        }
        const remove = [];
        this.meta.forEach((meta, clientid) => {
          if (clientid !== this.clientID && outdatedTimeout <= now - meta.lastUpdated && this.states.has(clientid)) {
            remove.push(clientid);
          }
        });
        if (remove.length > 0) {
          removeAwarenessStates(this, remove, "timeout");
        }
      }, floor3(outdatedTimeout / 10));
      doc2.on("destroy", () => {
        this.destroy();
      });
      this.setLocalState({});
    }
    destroy() {
      this.emit("destroy", [this]);
      this.setLocalState(null);
      super.destroy();
      clearInterval(this._checkInterval);
    }
    /**
     * @return {Object<string,any>|null}
     */
    getLocalState() {
      return this.states.get(this.clientID) || null;
    }
    /**
     * @param {Object<string,any>|null} state
     */
    setLocalState(state) {
      const clientID = this.clientID;
      const currLocalMeta = this.meta.get(clientID);
      const clock = currLocalMeta === void 0 ? 0 : currLocalMeta.clock + 1;
      const prevState = this.states.get(clientID);
      if (state === null) {
        this.states.delete(clientID);
      } else {
        this.states.set(clientID, state);
      }
      this.meta.set(clientID, {
        clock,
        lastUpdated: getUnixTime2()
      });
      const added = [];
      const updated = [];
      const filteredUpdated = [];
      const removed = [];
      if (state === null) {
        removed.push(clientID);
      } else if (prevState == null) {
        if (state != null) {
          added.push(clientID);
        }
      } else {
        updated.push(clientID);
        if (!equalityDeep2(prevState, state)) {
          filteredUpdated.push(clientID);
        }
      }
      if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
        this.emit("change", [{ added, updated: filteredUpdated, removed }, "local"]);
      }
      this.emit("update", [{ added, updated, removed }, "local"]);
    }
    /**
     * @param {string} field
     * @param {any} value
     */
    setLocalStateField(field, value) {
      const state = this.getLocalState();
      if (state !== null) {
        this.setLocalState({
          ...state,
          [field]: value
        });
      }
    }
    /**
     * @return {Map<number,Object<string,any>>}
     */
    getStates() {
      return this.states;
    }
  };
  var removeAwarenessStates = (awareness, clients, origin) => {
    const removed = [];
    for (let i = 0; i < clients.length; i++) {
      const clientID = clients[i];
      if (awareness.states.has(clientID)) {
        awareness.states.delete(clientID);
        if (clientID === awareness.clientID) {
          const curMeta = (
            /** @type {MetaClientState} */
            awareness.meta.get(clientID)
          );
          awareness.meta.set(clientID, {
            clock: curMeta.clock + 1,
            lastUpdated: getUnixTime2()
          });
        }
        removed.push(clientID);
      }
    }
    if (removed.length > 0) {
      awareness.emit("change", [{ added: [], updated: [], removed }, origin]);
      awareness.emit("update", [{ added: [], updated: [], removed }, origin]);
    }
  };
  var encodeAwarenessUpdate = (awareness, clients, states = awareness.states) => {
    const len = clients.length;
    const encoder = createEncoder2();
    writeVarUint3(encoder, len);
    for (let i = 0; i < len; i++) {
      const clientID = clients[i];
      const state = states.get(clientID) || null;
      const clock = (
        /** @type {MetaClientState} */
        awareness.meta.get(clientID).clock
      );
      writeVarUint3(encoder, clientID);
      writeVarUint3(encoder, clock);
      writeVarString3(encoder, JSON.stringify(state));
    }
    return toUint8Array2(encoder);
  };
  var applyAwarenessUpdate = (awareness, update, origin) => {
    const decoder = createDecoder2(update);
    const timestamp = getUnixTime2();
    const added = [];
    const updated = [];
    const filteredUpdated = [];
    const removed = [];
    const len = readVarUint3(decoder);
    for (let i = 0; i < len; i++) {
      const clientID = readVarUint3(decoder);
      let clock = readVarUint3(decoder);
      const state = JSON.parse(readVarString3(decoder));
      const clientMeta = awareness.meta.get(clientID);
      const prevState = awareness.states.get(clientID);
      const currClock = clientMeta === void 0 ? 0 : clientMeta.clock;
      if (currClock < clock || currClock === clock && state === null && awareness.states.has(clientID)) {
        if (state === null) {
          if (clientID === awareness.clientID && awareness.getLocalState() != null) {
            clock++;
          } else {
            awareness.states.delete(clientID);
          }
        } else {
          awareness.states.set(clientID, state);
        }
        awareness.meta.set(clientID, {
          clock,
          lastUpdated: timestamp
        });
        if (clientMeta === void 0 && state !== null) {
          added.push(clientID);
        } else if (clientMeta !== void 0 && state === null) {
          removed.push(clientID);
        } else if (state !== null) {
          if (!equalityDeep2(state, prevState)) {
            filteredUpdated.push(clientID);
          }
          updated.push(clientID);
        }
      }
    }
    if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
      awareness.emit("change", [{
        added,
        updated: filteredUpdated,
        removed
      }, origin]);
    }
    if (added.length > 0 || updated.length > 0 || removed.length > 0) {
      awareness.emit("update", [{
        added,
        updated,
        removed
      }, origin]);
    }
  };
  var EventEmitter = class {
    constructor() {
      this.callbacks = {};
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    on(event, fn) {
      if (!this.callbacks[event]) {
        this.callbacks[event] = [];
      }
      this.callbacks[event].push(fn);
      return this;
    }
    emit(event, ...args2) {
      const callbacks = this.callbacks[event];
      if (callbacks) {
        callbacks.forEach((callback) => callback.apply(this, args2));
      }
      return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    off(event, fn) {
      const callbacks = this.callbacks[event];
      if (callbacks) {
        if (fn) {
          this.callbacks[event] = callbacks.filter((callback) => callback !== fn);
        } else {
          delete this.callbacks[event];
        }
      }
      return this;
    }
    removeAllListeners() {
      this.callbacks = {};
    }
  };
  var IncomingMessage = class {
    constructor(data) {
      this.data = data;
      this.encoder = createEncoder2();
      this.decoder = createDecoder2(new Uint8Array(this.data));
    }
    peekVarString() {
      return peekVarString(this.decoder);
    }
    readVarUint() {
      return readVarUint3(this.decoder);
    }
    readVarString() {
      return readVarString3(this.decoder);
    }
    readVarUint8Array() {
      return readVarUint8Array3(this.decoder);
    }
    writeVarUint(type) {
      return writeVarUint3(this.encoder, type);
    }
    writeVarString(string) {
      return writeVarString3(this.encoder, string);
    }
    writeVarUint8Array(data) {
      return writeVarUint8Array3(this.encoder, data);
    }
    length() {
      return length$1(this.encoder);
    }
  };
  var MessageType;
  (function(MessageType2) {
    MessageType2[MessageType2["Sync"] = 0] = "Sync";
    MessageType2[MessageType2["Awareness"] = 1] = "Awareness";
    MessageType2[MessageType2["Auth"] = 2] = "Auth";
    MessageType2[MessageType2["QueryAwareness"] = 3] = "QueryAwareness";
    MessageType2[MessageType2["Stateless"] = 5] = "Stateless";
    MessageType2[MessageType2["CLOSE"] = 7] = "CLOSE";
    MessageType2[MessageType2["SyncStatus"] = 8] = "SyncStatus";
  })(MessageType || (MessageType = {}));
  var WebSocketStatus;
  (function(WebSocketStatus2) {
    WebSocketStatus2["Connecting"] = "connecting";
    WebSocketStatus2["Connected"] = "connected";
    WebSocketStatus2["Disconnected"] = "disconnected";
  })(WebSocketStatus || (WebSocketStatus = {}));
  var OutgoingMessage = class {
    constructor() {
      this.encoder = createEncoder2();
    }
    get(args2) {
      return args2.encoder;
    }
    toUint8Array() {
      return toUint8Array2(this.encoder);
    }
  };
  var CloseMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.CLOSE;
      this.description = "Ask the server to close the connection";
    }
    get(args2) {
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      return this.encoder;
    }
  };
  var HocuspocusProviderWebsocket = class extends EventEmitter {
    constructor(configuration) {
      super();
      this.messageQueue = [];
      this.configuration = {
        url: "",
        autoConnect: true,
        preserveTrailingSlash: false,
        // @ts-ignore
        document: void 0,
        WebSocketPolyfill: void 0,
        // TODO: this should depend on awareness.outdatedTime
        messageReconnectTimeout: 3e4,
        // 1 second
        delay: 1e3,
        // instant
        initialDelay: 0,
        // double the delay each time
        factor: 2,
        // unlimited retries
        maxAttempts: 0,
        // wait at least 1 second
        minDelay: 1e3,
        // at least every 30 seconds
        maxDelay: 3e4,
        // randomize
        jitter: true,
        // retry forever
        timeout: 0,
        onOpen: () => null,
        onConnect: () => null,
        onMessage: () => null,
        onOutgoingMessage: () => null,
        onStatus: () => null,
        onDisconnect: () => null,
        onClose: () => null,
        onDestroy: () => null,
        onAwarenessUpdate: () => null,
        onAwarenessChange: () => null,
        handleTimeout: null,
        providerMap: /* @__PURE__ */ new Map()
      };
      this.webSocket = null;
      this.webSocketHandlers = {};
      this.shouldConnect = true;
      this.status = WebSocketStatus.Disconnected;
      this.lastMessageReceived = 0;
      this.identifier = 0;
      this.intervals = {
        connectionChecker: null
      };
      this.connectionAttempt = null;
      this.receivedOnOpenPayload = void 0;
      this.closeTries = 0;
      this.setConfiguration(configuration);
      this.configuration.WebSocketPolyfill = configuration.WebSocketPolyfill ? configuration.WebSocketPolyfill : WebSocket;
      this.on("open", this.configuration.onOpen);
      this.on("open", this.onOpen.bind(this));
      this.on("connect", this.configuration.onConnect);
      this.on("message", this.configuration.onMessage);
      this.on("outgoingMessage", this.configuration.onOutgoingMessage);
      this.on("status", this.configuration.onStatus);
      this.on("disconnect", this.configuration.onDisconnect);
      this.on("close", this.configuration.onClose);
      this.on("destroy", this.configuration.onDestroy);
      this.on("awarenessUpdate", this.configuration.onAwarenessUpdate);
      this.on("awarenessChange", this.configuration.onAwarenessChange);
      this.on("close", this.onClose.bind(this));
      this.on("message", this.onMessage.bind(this));
      this.intervals.connectionChecker = setInterval(this.checkConnection.bind(this), this.configuration.messageReconnectTimeout / 10);
      if (this.shouldConnect) {
        this.connect();
      }
    }
    async onOpen(event) {
      this.status = WebSocketStatus.Connected;
      this.emit("status", { status: WebSocketStatus.Connected });
      this.cancelWebsocketRetry = void 0;
      this.receivedOnOpenPayload = event;
    }
    attach(provider) {
      this.configuration.providerMap.set(provider.configuration.name, provider);
      if (this.status === WebSocketStatus.Disconnected && this.shouldConnect) {
        this.connect();
      }
      if (this.receivedOnOpenPayload && this.status === WebSocketStatus.Connected) {
        provider.onOpen(this.receivedOnOpenPayload);
      }
    }
    detach(provider) {
      if (this.configuration.providerMap.has(provider.configuration.name)) {
        provider.send(CloseMessage, {
          documentName: provider.configuration.name
        });
        this.configuration.providerMap.delete(provider.configuration.name);
      }
    }
    setConfiguration(configuration = {}) {
      this.configuration = { ...this.configuration, ...configuration };
      if (!this.configuration.autoConnect) {
        this.shouldConnect = false;
      }
    }
    async connect() {
      if (this.status === WebSocketStatus.Connected) {
        return;
      }
      if (this.cancelWebsocketRetry) {
        this.cancelWebsocketRetry();
        this.cancelWebsocketRetry = void 0;
      }
      this.receivedOnOpenPayload = void 0;
      this.shouldConnect = true;
      const abortableRetry = () => {
        let cancelAttempt = false;
        const retryPromise2 = retry(this.createWebSocketConnection.bind(this), {
          delay: this.configuration.delay,
          initialDelay: this.configuration.initialDelay,
          factor: this.configuration.factor,
          maxAttempts: this.configuration.maxAttempts,
          minDelay: this.configuration.minDelay,
          maxDelay: this.configuration.maxDelay,
          jitter: this.configuration.jitter,
          timeout: this.configuration.timeout,
          handleTimeout: this.configuration.handleTimeout,
          beforeAttempt: (context) => {
            if (!this.shouldConnect || cancelAttempt) {
              context.abort();
            }
          }
        }).catch((error) => {
          if (error && error.code !== "ATTEMPT_ABORTED") {
            throw error;
          }
        });
        return {
          retryPromise: retryPromise2,
          cancelFunc: () => {
            cancelAttempt = true;
          }
        };
      };
      const { retryPromise, cancelFunc } = abortableRetry();
      this.cancelWebsocketRetry = cancelFunc;
      return retryPromise;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    attachWebSocketListeners(ws, reject) {
      const { identifier } = ws;
      const onMessageHandler = (payload) => this.emit("message", payload);
      const onCloseHandler = (payload) => this.emit("close", { event: payload });
      const onOpenHandler = (payload) => this.emit("open", payload);
      const onErrorHandler = (err) => {
        reject(err);
      };
      this.webSocketHandlers[identifier] = {
        message: onMessageHandler,
        close: onCloseHandler,
        open: onOpenHandler,
        error: onErrorHandler
      };
      const handlers = this.webSocketHandlers[ws.identifier];
      Object.keys(handlers).forEach((name) => {
        ws.addEventListener(name, handlers[name]);
      });
    }
    cleanupWebSocket() {
      if (!this.webSocket) {
        return;
      }
      const { identifier } = this.webSocket;
      const handlers = this.webSocketHandlers[identifier];
      Object.keys(handlers).forEach((name) => {
        var _a;
        (_a = this.webSocket) === null || _a === void 0 ? void 0 : _a.removeEventListener(name, handlers[name]);
        delete this.webSocketHandlers[identifier];
      });
      this.webSocket.close();
      this.webSocket = null;
    }
    createWebSocketConnection() {
      return new Promise((resolve, reject) => {
        if (this.webSocket) {
          this.messageQueue = [];
          this.cleanupWebSocket();
        }
        this.lastMessageReceived = 0;
        this.identifier += 1;
        const ws = new this.configuration.WebSocketPolyfill(this.url);
        ws.binaryType = "arraybuffer";
        ws.identifier = this.identifier;
        this.attachWebSocketListeners(ws, reject);
        this.webSocket = ws;
        this.status = WebSocketStatus.Connecting;
        this.emit("status", { status: WebSocketStatus.Connecting });
        this.connectionAttempt = {
          resolve,
          reject
        };
      });
    }
    onMessage(event) {
      var _a;
      this.resolveConnectionAttempt();
      this.lastMessageReceived = getUnixTime2();
      const message = new IncomingMessage(event.data);
      const documentName = message.peekVarString();
      (_a = this.configuration.providerMap.get(documentName)) === null || _a === void 0 ? void 0 : _a.onMessage(event);
    }
    resolveConnectionAttempt() {
      if (this.connectionAttempt) {
        this.connectionAttempt.resolve();
        this.connectionAttempt = null;
        this.status = WebSocketStatus.Connected;
        this.emit("status", { status: WebSocketStatus.Connected });
        this.emit("connect");
        this.messageQueue.forEach((message) => this.send(message));
        this.messageQueue = [];
      }
    }
    stopConnectionAttempt() {
      this.connectionAttempt = null;
    }
    rejectConnectionAttempt() {
      var _a;
      (_a = this.connectionAttempt) === null || _a === void 0 ? void 0 : _a.reject();
      this.connectionAttempt = null;
    }
    checkConnection() {
      var _a;
      if (this.status !== WebSocketStatus.Connected) {
        return;
      }
      if (!this.lastMessageReceived) {
        return;
      }
      if (this.configuration.messageReconnectTimeout >= getUnixTime2() - this.lastMessageReceived) {
        return;
      }
      this.closeTries += 1;
      if (this.closeTries > 2) {
        this.onClose({
          event: {
            code: 4408,
            reason: "forced"
          }
        });
        this.closeTries = 0;
      } else {
        (_a = this.webSocket) === null || _a === void 0 ? void 0 : _a.close();
        this.messageQueue = [];
      }
    }
    get serverUrl() {
      if (this.configuration.preserveTrailingSlash) {
        return this.configuration.url;
      }
      let url = this.configuration.url;
      while (url[url.length - 1] === "/") {
        url = url.slice(0, url.length - 1);
      }
      return url;
    }
    get url() {
      return this.serverUrl;
    }
    disconnect() {
      this.shouldConnect = false;
      if (this.webSocket === null) {
        return;
      }
      try {
        this.webSocket.close();
        this.messageQueue = [];
      } catch (e) {
        console.error(e);
      }
    }
    send(message) {
      var _a;
      if (((_a = this.webSocket) === null || _a === void 0 ? void 0 : _a.readyState) === WsReadyStates.Open) {
        this.webSocket.send(message);
      } else {
        this.messageQueue.push(message);
      }
    }
    onClose({ event }) {
      this.closeTries = 0;
      this.cleanupWebSocket();
      if (this.connectionAttempt) {
        this.rejectConnectionAttempt();
      }
      this.status = WebSocketStatus.Disconnected;
      this.emit("status", { status: WebSocketStatus.Disconnected });
      this.emit("disconnect", { event });
      if (!this.cancelWebsocketRetry && this.shouldConnect) {
        setTimeout(() => {
          this.connect();
        }, this.configuration.delay);
      }
    }
    destroy() {
      this.emit("destroy");
      clearInterval(this.intervals.connectionChecker);
      this.stopConnectionAttempt();
      this.disconnect();
      this.removeAllListeners();
      this.cleanupWebSocket();
    }
  };
  var messageYjsSyncStep1 = 0;
  var messageYjsSyncStep2 = 1;
  var messageYjsUpdate = 2;
  var writeSyncStep1 = (encoder, doc2) => {
    writeVarUint3(encoder, messageYjsSyncStep1);
    const sv = encodeStateVector(doc2);
    writeVarUint8Array3(encoder, sv);
  };
  var writeSyncStep2 = (encoder, doc2, encodedStateVector) => {
    writeVarUint3(encoder, messageYjsSyncStep2);
    writeVarUint8Array3(encoder, encodeStateAsUpdate(doc2, encodedStateVector));
  };
  var readSyncStep1 = (decoder, encoder, doc2) => writeSyncStep2(encoder, doc2, readVarUint8Array3(decoder));
  var readSyncStep2 = (decoder, doc2, transactionOrigin) => {
    try {
      applyUpdate(doc2, readVarUint8Array3(decoder), transactionOrigin);
    } catch (error) {
      console.error("Caught error while handling a Yjs update", error);
    }
  };
  var writeUpdate = (encoder, update) => {
    writeVarUint3(encoder, messageYjsUpdate);
    writeVarUint8Array3(encoder, update);
  };
  var readUpdate = readSyncStep2;
  var readSyncMessage = (decoder, encoder, doc2, transactionOrigin) => {
    const messageType = readVarUint3(decoder);
    switch (messageType) {
      case messageYjsSyncStep1:
        readSyncStep1(decoder, encoder, doc2);
        break;
      case messageYjsSyncStep2:
        readSyncStep2(decoder, doc2, transactionOrigin);
        break;
      case messageYjsUpdate:
        readUpdate(decoder, doc2, transactionOrigin);
        break;
      default:
        throw new Error("Unknown message type");
    }
    return messageType;
  };
  var MessageReceiver = class {
    constructor(message) {
      this.message = message;
    }
    apply(provider, emitSynced) {
      const { message } = this;
      const type = message.readVarUint();
      const emptyMessageLength = message.length();
      switch (type) {
        case MessageType.Sync:
          this.applySyncMessage(provider, emitSynced);
          break;
        case MessageType.Awareness:
          this.applyAwarenessMessage(provider);
          break;
        case MessageType.Auth:
          this.applyAuthMessage(provider);
          break;
        case MessageType.QueryAwareness:
          this.applyQueryAwarenessMessage(provider);
          break;
        case MessageType.Stateless:
          provider.receiveStateless(readVarString3(message.decoder));
          break;
        case MessageType.SyncStatus:
          this.applySyncStatusMessage(provider, readVarInt2(message.decoder) === 1);
          break;
        case MessageType.CLOSE:
          const event = {
            code: 1e3,
            reason: readVarString3(message.decoder),
            // @ts-ignore
            target: provider.configuration.websocketProvider.webSocket,
            type: "close"
          };
          provider.onClose();
          provider.configuration.onClose({ event });
          provider.forwardClose({ event });
          break;
        default:
          throw new Error(`Can\u2019t apply message of unknown type: ${type}`);
      }
      if (message.length() > emptyMessageLength + 1) {
        provider.send(OutgoingMessage, { encoder: message.encoder });
      }
    }
    applySyncMessage(provider, emitSynced) {
      const { message } = this;
      message.writeVarUint(MessageType.Sync);
      const syncMessageType = readSyncMessage(message.decoder, message.encoder, provider.document, provider);
      if (emitSynced && syncMessageType === messageYjsSyncStep2) {
        provider.synced = true;
      }
    }
    applySyncStatusMessage(provider, applied) {
      if (applied) {
        provider.decrementUnsyncedChanges();
      }
    }
    applyAwarenessMessage(provider) {
      if (!provider.awareness)
        return;
      const { message } = this;
      applyAwarenessUpdate(provider.awareness, message.readVarUint8Array(), provider);
    }
    applyAuthMessage(provider) {
      const { message } = this;
      readAuthMessage(message.decoder, provider.sendToken.bind(provider), provider.permissionDeniedHandler.bind(provider), provider.authenticatedHandler.bind(provider));
    }
    applyQueryAwarenessMessage(provider) {
      if (!provider.awareness)
        return;
      const { message } = this;
      message.writeVarUint(MessageType.Awareness);
      message.writeVarUint8Array(encodeAwarenessUpdate(provider.awareness, Array.from(provider.awareness.getStates().keys())));
    }
  };
  var MessageSender = class {
    constructor(Message, args2 = {}) {
      this.message = new Message();
      this.encoder = this.message.get(args2);
    }
    create() {
      return toUint8Array2(this.encoder);
    }
    send(webSocket) {
      webSocket === null || webSocket === void 0 ? void 0 : webSocket.send(this.create());
    }
  };
  var AuthenticationMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.Auth;
      this.description = "Authentication";
    }
    get(args2) {
      if (typeof args2.token === "undefined") {
        throw new Error("The authentication message requires `token` as an argument.");
      }
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      writeAuthentication(this.encoder, args2.token);
      return this.encoder;
    }
  };
  var AwarenessMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.Awareness;
      this.description = "Awareness states update";
    }
    get(args2) {
      if (typeof args2.awareness === "undefined") {
        throw new Error("The awareness message requires awareness as an argument");
      }
      if (typeof args2.clients === "undefined") {
        throw new Error("The awareness message requires clients as an argument");
      }
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      let awarenessUpdate;
      if (args2.states === void 0) {
        awarenessUpdate = encodeAwarenessUpdate(args2.awareness, args2.clients);
      } else {
        awarenessUpdate = encodeAwarenessUpdate(args2.awareness, args2.clients, args2.states);
      }
      writeVarUint8Array3(this.encoder, awarenessUpdate);
      return this.encoder;
    }
  };
  var StatelessMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.Stateless;
      this.description = "A stateless message";
    }
    get(args2) {
      var _a;
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      writeVarString3(this.encoder, (_a = args2.payload) !== null && _a !== void 0 ? _a : "");
      return this.encoder;
    }
  };
  var SyncStepOneMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.Sync;
      this.description = "First sync step";
    }
    get(args2) {
      if (typeof args2.document === "undefined") {
        throw new Error("The sync step one message requires document as an argument");
      }
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      writeSyncStep1(this.encoder, args2.document);
      return this.encoder;
    }
  };
  var UpdateMessage = class extends OutgoingMessage {
    constructor() {
      super(...arguments);
      this.type = MessageType.Sync;
      this.description = "A document update";
    }
    get(args2) {
      writeVarString3(this.encoder, args2.documentName);
      writeVarUint3(this.encoder, this.type);
      writeUpdate(this.encoder, args2.update);
      return this.encoder;
    }
  };
  var AwarenessError = class extends Error {
    constructor() {
      super(...arguments);
      this.code = 1001;
    }
  };
  var HocuspocusProvider = class extends EventEmitter {
    constructor(configuration) {
      var _a, _b, _c;
      super();
      this.configuration = {
        name: "",
        // @ts-ignore
        document: void 0,
        // @ts-ignore
        awareness: void 0,
        token: null,
        forceSyncInterval: false,
        onAuthenticated: () => null,
        onAuthenticationFailed: () => null,
        onOpen: () => null,
        onConnect: () => null,
        onMessage: () => null,
        onOutgoingMessage: () => null,
        onSynced: () => null,
        onStatus: () => null,
        onDisconnect: () => null,
        onClose: () => null,
        onDestroy: () => null,
        onAwarenessUpdate: () => null,
        onAwarenessChange: () => null,
        onStateless: () => null,
        onUnsyncedChanges: () => null
      };
      this.isSynced = false;
      this.unsyncedChanges = 0;
      this.isAuthenticated = false;
      this.authorizedScope = void 0;
      this.manageSocket = false;
      this._isAttached = false;
      this.intervals = {
        forceSync: null
      };
      this.boundDocumentUpdateHandler = this.documentUpdateHandler.bind(this);
      this.boundAwarenessUpdateHandler = this.awarenessUpdateHandler.bind(this);
      this.boundPageHide = this.pageHide.bind(this);
      this.boundOnOpen = this.onOpen.bind(this);
      this.boundOnClose = this.onClose.bind(this);
      this.forwardConnect = () => this.emit("connect");
      this.forwardStatus = (e) => this.emit("status", e);
      this.forwardClose = (e) => this.emit("close", e);
      this.forwardDisconnect = (e) => this.emit("disconnect", e);
      this.forwardDestroy = () => this.emit("destroy");
      this.setConfiguration(configuration);
      this.configuration.document = configuration.document ? configuration.document : new Doc();
      this.configuration.awareness = configuration.awareness !== void 0 ? configuration.awareness : new Awareness(this.document);
      this.on("open", this.configuration.onOpen);
      this.on("message", this.configuration.onMessage);
      this.on("outgoingMessage", this.configuration.onOutgoingMessage);
      this.on("synced", this.configuration.onSynced);
      this.on("destroy", this.configuration.onDestroy);
      this.on("awarenessUpdate", this.configuration.onAwarenessUpdate);
      this.on("awarenessChange", this.configuration.onAwarenessChange);
      this.on("stateless", this.configuration.onStateless);
      this.on("unsyncedChanges", this.configuration.onUnsyncedChanges);
      this.on("authenticated", this.configuration.onAuthenticated);
      this.on("authenticationFailed", this.configuration.onAuthenticationFailed);
      (_a = this.awareness) === null || _a === void 0 ? void 0 : _a.on("update", () => {
        this.emit("awarenessUpdate", {
          states: awarenessStatesToArray(this.awareness.getStates())
        });
      });
      (_b = this.awareness) === null || _b === void 0 ? void 0 : _b.on("change", () => {
        this.emit("awarenessChange", {
          states: awarenessStatesToArray(this.awareness.getStates())
        });
      });
      this.document.on("update", this.boundDocumentUpdateHandler);
      (_c = this.awareness) === null || _c === void 0 ? void 0 : _c.on("update", this.boundAwarenessUpdateHandler);
      this.registerEventListeners();
      if (this.configuration.forceSyncInterval && typeof this.configuration.forceSyncInterval === "number") {
        this.intervals.forceSync = setInterval(this.forceSync.bind(this), this.configuration.forceSyncInterval);
      }
      if (this.manageSocket) {
        this.attach();
      }
    }
    setConfiguration(configuration = {}) {
      if (!configuration.websocketProvider) {
        this.manageSocket = true;
        this.configuration.websocketProvider = new HocuspocusProviderWebsocket(configuration);
      }
      this.configuration = { ...this.configuration, ...configuration };
    }
    get document() {
      return this.configuration.document;
    }
    get isAttached() {
      return this._isAttached;
    }
    get awareness() {
      return this.configuration.awareness;
    }
    get hasUnsyncedChanges() {
      return this.unsyncedChanges > 0;
    }
    resetUnsyncedChanges() {
      this.unsyncedChanges = 1;
      this.emit("unsyncedChanges", { number: this.unsyncedChanges });
    }
    incrementUnsyncedChanges() {
      this.unsyncedChanges += 1;
      this.emit("unsyncedChanges", { number: this.unsyncedChanges });
    }
    decrementUnsyncedChanges() {
      if (this.unsyncedChanges > 0) {
        this.unsyncedChanges -= 1;
      }
      if (this.unsyncedChanges === 0) {
        this.synced = true;
      }
      this.emit("unsyncedChanges", { number: this.unsyncedChanges });
    }
    forceSync() {
      this.resetUnsyncedChanges();
      this.send(SyncStepOneMessage, {
        document: this.document,
        documentName: this.configuration.name
      });
    }
    pageHide() {
      if (this.awareness) {
        removeAwarenessStates(this.awareness, [this.document.clientID], "page hide");
      }
    }
    registerEventListeners() {
      if (typeof window === "undefined" || !("addEventListener" in window)) {
        return;
      }
      window.addEventListener("pagehide", this.boundPageHide);
    }
    sendStateless(payload) {
      this.send(StatelessMessage, {
        documentName: this.configuration.name,
        payload
      });
    }
    async sendToken() {
      let token;
      try {
        token = await this.getToken();
      } catch (error) {
        this.permissionDeniedHandler(`Failed to get token during sendToken(): ${error}`);
        return;
      }
      this.send(AuthenticationMessage, {
        token: token !== null && token !== void 0 ? token : "",
        documentName: this.configuration.name
      });
    }
    documentUpdateHandler(update, origin) {
      if (origin === this) {
        return;
      }
      this.incrementUnsyncedChanges();
      this.send(UpdateMessage, { update, documentName: this.configuration.name });
    }
    awarenessUpdateHandler({ added, updated, removed }, origin) {
      const changedClients = added.concat(updated).concat(removed);
      this.send(AwarenessMessage, {
        awareness: this.awareness,
        clients: changedClients,
        documentName: this.configuration.name
      });
    }
    /**
     * Indicates whether a first handshake with the server has been established
     *
     * Note: this does not mean all updates from the client have been persisted to the backend. For this,
     * use `hasUnsyncedChanges`.
     */
    get synced() {
      return this.isSynced;
    }
    set synced(state) {
      if (this.isSynced === state) {
        return;
      }
      this.isSynced = state;
      if (state) {
        this.emit("synced", { state });
      }
    }
    receiveStateless(payload) {
      this.emit("stateless", { payload });
    }
    // not needed, but provides backward compatibility with e.g. lexical/yjs
    async connect() {
      if (this.manageSocket) {
        return this.configuration.websocketProvider.connect();
      }
      console.warn("HocuspocusProvider::connect() is deprecated and does not do anything. Please connect/disconnect on the websocketProvider, or attach/deattach providers.");
    }
    disconnect() {
      if (this.manageSocket) {
        return this.configuration.websocketProvider.disconnect();
      }
      console.warn("HocuspocusProvider::disconnect() is deprecated and does not do anything. Please connect/disconnect on the websocketProvider, or attach/deattach providers.");
    }
    async onOpen(event) {
      this.isAuthenticated = false;
      this.emit("open", { event });
      await this.sendToken();
      this.startSync();
    }
    async getToken() {
      if (typeof this.configuration.token === "function") {
        const token = await this.configuration.token();
        return token;
      }
      return this.configuration.token;
    }
    startSync() {
      this.resetUnsyncedChanges();
      this.send(SyncStepOneMessage, {
        document: this.document,
        documentName: this.configuration.name
      });
      if (this.awareness && this.awareness.getLocalState() !== null) {
        this.send(AwarenessMessage, {
          awareness: this.awareness,
          clients: [this.document.clientID],
          documentName: this.configuration.name
        });
      }
    }
    send(message, args2) {
      if (!this._isAttached)
        return;
      const messageSender = new MessageSender(message, args2);
      this.emit("outgoingMessage", { message: messageSender.message });
      messageSender.send(this.configuration.websocketProvider);
    }
    onMessage(event) {
      const message = new IncomingMessage(event.data);
      const documentName = message.readVarString();
      message.writeVarString(documentName);
      this.emit("message", { event, message: new IncomingMessage(event.data) });
      new MessageReceiver(message).apply(this, true);
    }
    onClose() {
      this.isAuthenticated = false;
      this.synced = false;
      if (this.awareness) {
        removeAwarenessStates(this.awareness, Array.from(this.awareness.getStates().keys()).filter((client) => client !== this.document.clientID), this);
      }
    }
    destroy() {
      this.emit("destroy");
      if (this.intervals.forceSync) {
        clearInterval(this.intervals.forceSync);
      }
      if (this.awareness) {
        removeAwarenessStates(this.awareness, [this.document.clientID], "provider destroy");
        this.awareness.off("update", this.boundAwarenessUpdateHandler);
        this.awareness.destroy();
      }
      this.document.off("update", this.boundDocumentUpdateHandler);
      this.removeAllListeners();
      this.detach();
      if (this.manageSocket) {
        this.configuration.websocketProvider.destroy();
      }
      if (typeof window === "undefined" || !("removeEventListener" in window)) {
        return;
      }
      window.removeEventListener("pagehide", this.boundPageHide);
    }
    detach() {
      this.configuration.websocketProvider.off("connect", this.configuration.onConnect);
      this.configuration.websocketProvider.off("connect", this.forwardConnect);
      this.configuration.websocketProvider.off("status", this.forwardStatus);
      this.configuration.websocketProvider.off("status", this.configuration.onStatus);
      this.configuration.websocketProvider.off("open", this.boundOnOpen);
      this.configuration.websocketProvider.off("close", this.boundOnClose);
      this.configuration.websocketProvider.off("close", this.configuration.onClose);
      this.configuration.websocketProvider.off("close", this.forwardClose);
      this.configuration.websocketProvider.off("disconnect", this.configuration.onDisconnect);
      this.configuration.websocketProvider.off("disconnect", this.forwardDisconnect);
      this.configuration.websocketProvider.off("destroy", this.configuration.onDestroy);
      this.configuration.websocketProvider.off("destroy", this.forwardDestroy);
      this.configuration.websocketProvider.detach(this);
      this._isAttached = false;
    }
    attach() {
      if (this._isAttached)
        return;
      this.configuration.websocketProvider.on("connect", this.configuration.onConnect);
      this.configuration.websocketProvider.on("connect", this.forwardConnect);
      this.configuration.websocketProvider.on("status", this.configuration.onStatus);
      this.configuration.websocketProvider.on("status", this.forwardStatus);
      this.configuration.websocketProvider.on("open", this.boundOnOpen);
      this.configuration.websocketProvider.on("close", this.boundOnClose);
      this.configuration.websocketProvider.on("close", this.configuration.onClose);
      this.configuration.websocketProvider.on("close", this.forwardClose);
      this.configuration.websocketProvider.on("disconnect", this.configuration.onDisconnect);
      this.configuration.websocketProvider.on("disconnect", this.forwardDisconnect);
      this.configuration.websocketProvider.on("destroy", this.configuration.onDestroy);
      this.configuration.websocketProvider.on("destroy", this.forwardDestroy);
      this.configuration.websocketProvider.attach(this);
      this._isAttached = true;
    }
    permissionDeniedHandler(reason) {
      this.emit("authenticationFailed", { reason });
      this.isAuthenticated = false;
    }
    authenticatedHandler(scope) {
      this.isAuthenticated = true;
      this.authorizedScope = scope;
      this.emit("authenticated", { scope });
    }
    setAwarenessField(key, value) {
      if (!this.awareness) {
        throw new AwarenessError(`Cannot set awareness field "${key}" to ${JSON.stringify(value)}. You have disabled Awareness for this provider by explicitly passing awareness: null in the provider configuration.`);
      }
      this.awareness.setLocalStateField(key, value);
    }
  };

  // src/bridge/cursor-presence/userColor.ts
  var CURSOR_PALETTE = [
    "#E53935",
    "#1E88E5",
    "#43A047",
    "#FB8C00",
    "#8E24AA",
    "#00ACC1",
    "#F4511E",
    "#3949AB",
    "#7CB342",
    "#D81B60",
    "#6D4C41",
    "#546E7A"
  ];
  function hashString(input) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function getUserColor(userId) {
    const normalized = userId.trim() || "anonymous";
    return CURSOR_PALETTE[hashString(normalized) % CURSOR_PALETTE.length];
  }

  // src/bridge/cursor-presence/CursorPresenceProvider.ts
  var DEFAULT_THROTTLE_MS = 33;
  var CursorPresenceProvider = class {
    constructor(provider, user, onRemoteChange, throttleMs = DEFAULT_THROTTLE_MS) {
      this.provider = provider;
      this.lastBroadcastAt = 0;
      this.destroyed = false;
      this.boundAwarenessChange = () => this.onRemoteChange();
      this.onRemoteChange = onRemoteChange;
      this.throttleMs = throttleMs;
      this.provider.setAwarenessField("user", user);
      this.provider.setAwarenessField("cursor", null);
      this.provider.awareness?.on("change", this.boundAwarenessChange);
    }
    /**
     * Broadcast typing caret to peers via awareness.
     * Does not create any local DOM — peers render it; the typist does not.
     * Passing `null` clears immediately (no throttle) so inactive cursors vanish.
     */
    setLocalCursor(cursor) {
      if (this.destroyed) return;
      if (cursor === null) {
        window.clearTimeout(this.throttleTimer);
        this.pendingCursor = null;
        this.flushBroadcast();
        return;
      }
      this.pendingCursor = cursor;
      const elapsed = performance.now() - this.lastBroadcastAt;
      if (elapsed >= this.throttleMs) {
        this.flushBroadcast();
        return;
      }
      window.clearTimeout(this.throttleTimer);
      this.throttleTimer = window.setTimeout(() => this.flushBroadcast(), this.throttleMs - elapsed);
    }
    flushBroadcast() {
      if (this.destroyed || this.pendingCursor === void 0) return;
      this.lastBroadcastAt = performance.now();
      this.provider.setAwarenessField("cursor", this.pendingCursor);
      this.pendingCursor = void 0;
    }
    syncOverlayFromAwareness(sync) {
      const awareness = this.provider.awareness;
      if (awareness) sync(awareness);
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      window.clearTimeout(this.throttleTimer);
      this.provider.setAwarenessField("cursor", null);
      this.provider.awareness?.off("change", this.boundAwarenessChange);
    }
  };

  // src/bridge/cursor-presence/caretMetrics.ts
  var MIRROR_PROPERTIES = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "whiteSpace",
    "wordWrap",
    "wordBreak"
  ];
  var mirrorDiv = null;
  function getMirrorDiv() {
    if (!mirrorDiv) {
      mirrorDiv = document.createElement("div");
      mirrorDiv.id = "lowcoder-cursor-mirror";
      mirrorDiv.setAttribute("aria-hidden", "true");
      mirrorDiv.style.cssText = "position:absolute;visibility:hidden;white-space:pre-wrap;word-wrap:break-word;top:0;left:-9999px;";
      document.body.appendChild(mirrorDiv);
    }
    return mirrorDiv;
  }
  function toKebabCase(prop) {
    return prop.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  function copyInputStyles(element2, div) {
    const computed = window.getComputedStyle(element2);
    for (const prop of MIRROR_PROPERTIES) {
      const kebab = toKebabCase(prop);
      div.style.setProperty(kebab, computed.getPropertyValue(kebab));
    }
    div.style.width = `${element2.clientWidth}px`;
    div.style.whiteSpace = element2 instanceof HTMLTextAreaElement ? "pre-wrap" : "nowrap";
  }
  function fieldLineHeight(field) {
    const style = window.getComputedStyle(field);
    return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
  }
  function getFieldFallbackCaret(field) {
    const rect = field.getBoundingClientRect();
    const height = fieldLineHeight(field);
    const style = window.getComputedStyle(field);
    const padL = parseFloat(style.paddingLeft || "0");
    const padT = parseFloat(style.paddingTop || "0");
    return {
      left: rect.left + padL + 4,
      top: rect.top + padT + 2,
      height
    };
  }
  function getContentEditableCaret(field) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return getFieldFallbackCaret(field);
    const range = sel.getRangeAt(0);
    if (!field.contains(range.startContainer)) return getFieldFallbackCaret(field);
    const collapsed = range.cloneRange();
    collapsed.collapse(true);
    const rects = collapsed.getClientRects();
    const rect = rects.length > 0 ? rects[0] : collapsed.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return getFieldFallbackCaret(field);
    return { left: rect.left, top: rect.top, height: Math.max(rect.height, fieldLineHeight(field)) };
  }
  function getCaretCoordinatesForField(field, position) {
    if (field instanceof HTMLElement && field.isContentEditable && !(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
      return getContentEditableCaret(field);
    }
    if (position == null) return getFieldFallbackCaret(field);
    const exact = getCaretCoordinates(field, position);
    return exact ?? getFieldFallbackCaret(field);
  }
  function getCaretCoordinates(element2, position) {
    if (!element2.isConnected) return null;
    const div = getMirrorDiv();
    copyInputStyles(element2, div);
    const value = element2.value;
    const clamped = Math.max(0, Math.min(position, value.length));
    const before = value.slice(0, clamped);
    const after = value.slice(clamped) || ".";
    div.textContent = before;
    const span = document.createElement("span");
    span.textContent = after;
    div.appendChild(span);
    const elementRect = element2.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();
    const divRect = div.getBoundingClientRect();
    const style = window.getComputedStyle(element2);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
    const left = elementRect.left - element2.scrollLeft + (spanRect.left - divRect.left) + parseFloat(style.borderLeftWidth || "0") + parseFloat(style.paddingLeft || "0");
    const top = elementRect.top - element2.scrollTop + (spanRect.top - divRect.top) + parseFloat(style.borderTopWidth || "0") + parseFloat(style.paddingTop || "0");
    div.textContent = "";
    const coords = { left, top, height: lineHeight };
    if (!Number.isFinite(coords.left) || !Number.isFinite(coords.top)) {
      return null;
    }
    return coords;
  }
  function getSelectionRectsForField(field, anchor, head) {
    if (field instanceof HTMLElement && field.isContentEditable && !(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || anchor === head) return [];
      const range = sel.getRangeAt(0);
      if (!field.contains(range.startContainer)) return [];
      const rects = [];
      for (const r of Array.from(range.getClientRects())) {
        rects.push({ left: r.left, top: r.top, width: r.width, height: r.height });
      }
      return rects;
    }
    return getSelectionRects(field, anchor, head);
  }
  function getSelectionRects(element2, anchor, head) {
    const start = Math.min(anchor, head);
    const end = Math.max(anchor, head);
    if (start === end) return [];
    const startCoords = getCaretCoordinates(element2, start);
    const endCoords = getCaretCoordinates(element2, end);
    if (!startCoords || !endCoords) return [];
    const height = startCoords.height;
    if (Math.abs(startCoords.top - endCoords.top) < height * 0.5) {
      return [{
        left: startCoords.left,
        top: startCoords.top,
        width: Math.max(2, endCoords.left - startCoords.left),
        height
      }];
    }
    const value = element2.value;
    const lineStart = value.lastIndexOf("\n", start) + 1;
    const lineEnd = value.indexOf("\n", end);
    const lineEndIndex = lineEnd === -1 ? value.length : lineEnd;
    const lineEndCoords = getCaretCoordinates(element2, lineEndIndex);
    const lineStartCoords = getCaretCoordinates(element2, lineStart);
    const rects = [];
    if (lineEndCoords) {
      rects.push({
        left: startCoords.left,
        top: startCoords.top,
        width: Math.max(2, lineEndCoords.left - startCoords.left),
        height
      });
    }
    if (lineStartCoords) {
      rects.push({
        left: lineStartCoords.left,
        top: endCoords.top,
        width: Math.max(2, endCoords.left - lineStartCoords.left),
        height
      });
    }
    return rects;
  }
  function destroyCaretMirror() {
    mirrorDiv?.remove();
    mirrorDiv = null;
  }

  // src/bridge/cursor-presence/textField.ts
  var IGNORED_INPUT_TYPES = /* @__PURE__ */ new Set([
    "hidden",
    "checkbox",
    "radio",
    "button",
    "submit",
    "file",
    "password"
  ]);
  function isTextFieldElement(el) {
    if (!el) return false;
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLInputElement) {
      const type = (el.getAttribute("type") || el.type || "text").toLowerCase();
      return !IGNORED_INPUT_TYPES.has(type);
    }
    if (el instanceof HTMLElement && el.isContentEditable) return true;
    return false;
  }
  function getFocusedTextField() {
    const el = document.activeElement;
    if (isTextFieldElement(el)) return el;
    if (el instanceof HTMLElement) {
      const inner = el.querySelector(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
      );
      if (isTextFieldElement(inner)) return inner;
    }
    return null;
  }
  function listEditableFields(container = document) {
    const nodes = container.querySelectorAll(
      [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="number"]',
        'input[type="tel"]',
        'input[type="url"]',
        'input[type="search"]',
        'input[type="short_text"]',
        'input[type="long_text"]',
        'input[type="phone_number"]',
        "input[name]",
        "input:not([type])",
        "textarea",
        '[contenteditable="true"]',
        '[role="textbox"]'
      ].join(", ")
    );
    return Array.from(nodes).filter((field) => {
      if (!isTextFieldElement(field)) return false;
      const rect = field.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }
  function getFieldText(field) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      return field.value;
    }
    return field.textContent ?? "";
  }
  function getFieldSelection(field) {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      return {
        anchor: field.selectionStart ?? 0,
        head: field.selectionEnd ?? 0
      };
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const len = getFieldText(field).length;
      return { anchor: len, head: len };
    }
    const range = sel.getRangeAt(0);
    if (!field.contains(range.startContainer)) {
      const len = getFieldText(field).length;
      return { anchor: len, head: len };
    }
    const pre = range.cloneRange();
    pre.selectNodeContents(field);
    pre.setEnd(range.startContainer, range.startOffset);
    const anchor = pre.toString().length;
    pre.setEnd(range.endContainer, range.endOffset);
    const head = pre.toString().length;
    return { anchor, head };
  }
  function extractQuestionUuid(value) {
    const match2 = value.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    return match2?.[1] ?? null;
  }
  function getCursorFieldKey(field, step, bridgeGetFieldKey) {
    if (bridgeGetFieldKey && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return bridgeGetFieldKey(field);
    }
    const name = field.getAttribute("name")?.trim();
    if (name) return `name:${name}`;
    const labelledBy = field.getAttribute("aria-labelledby") || "";
    const fromLabel = extractQuestionUuid(labelledBy);
    if (fromLabel) return `qid:${fromLabel}`;
    const id2 = field.getAttribute("id") || "";
    const fromId = extractQuestionUuid(id2);
    if (fromId) return `qid:${fromId}`;
    const qa = field.getAttribute("data-qa");
    if (qa) return `qa:${qa}:step:${step}`;
    return `ce:step:${step}`;
  }
  function findFieldByCursorKey(key, step, bridgeFindFieldByKey) {
    if (bridgeFindFieldByKey) {
      const bridged = bridgeFindFieldByKey(key);
      if (bridged) return bridged;
    }
    for (const field of listEditableFields()) {
      if (getCursorFieldKey(field, step) === key) return field;
    }
    if (key.startsWith("name:")) {
      const name = key.slice("name:".length);
      const el = document.querySelector(`input[name="${CSS.escape(name)}"], textarea[name="${CSS.escape(name)}"]`);
      if (isTextFieldElement(el)) return el;
    }
    if (key.startsWith("qid:")) {
      const qid = key.slice("qid:".length);
      const sel = `[aria-labelledby*="${CSS.escape(qid)}"], [id*="${CSS.escape(qid)}"]`;
      for (const el of document.querySelectorAll(sel)) {
        if (isTextFieldElement(el)) return el;
      }
    }
    return null;
  }

  // src/bridge/cursor-presence/RemoteCursor.ts
  var CURSOR_CLASS = "lowcoder-remote-cursor";
  var LABEL_CLASS = "lowcoder-remote-cursor-label";
  var CARET_CLASS = "lowcoder-remote-cursor-caret";
  var SELECTION_CLASS = "lowcoder-remote-cursor-selection";
  var CARET_VERTICAL_OFFSET_PX = -6;
  var RemoteCursor = class {
    constructor(clientId) {
      this.selectionHighlights = [];
      this.selectionKey = "";
      this.visible = false;
      this.clientId = clientId;
      this.root = document.createElement("div");
      this.root.className = CURSOR_CLASS;
      this.root.dataset.clientId = String(clientId);
      this.root.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;transition:opacity 120ms ease;";
      this.label = document.createElement("div");
      this.label.className = LABEL_CLASS;
      this.label.style.cssText = "position:absolute;transform:translate(-2px,calc(-100% - 4px));padding:1px 6px;border-radius:3px;font:500 11px/16px system-ui,sans-serif;color:#fff;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;";
      this.caret = document.createElement("div");
      this.caret.className = CARET_CLASS;
      this.caret.style.cssText = "position:absolute;width:2px;border-radius:1px;transform:translateX(-1px);";
      this.root.append(this.caret, this.label);
      this.hide();
    }
    mount(container) {
      if (!this.root.isConnected) container.appendChild(this.root);
    }
    update(state, overlayContainer) {
      if (!state.online || !state.cursor?.typing) {
        this.hide();
        return;
      }
      this.visible = true;
      this.root.style.opacity = "1";
      this.root.style.display = "block";
      const { user, x, y, height, selectionRects } = state;
      this.root.style.transform = `translate(${x}px, ${y}px)`;
      this.label.textContent = user.name;
      this.label.style.backgroundColor = user.color;
      this.caret.style.backgroundColor = user.color;
      this.caret.style.height = `${Math.max(6, height)}px`;
      this.caret.style.top = `${CARET_VERTICAL_OFFSET_PX}px`;
      this.renderSelectionHighlights(user.color, selectionRects, overlayContainer);
    }
    updatePosition(x, y) {
      if (!this.visible) return;
      this.root.style.transform = `translate(${x}px, ${y}px)`;
    }
    hide() {
      this.visible = false;
      this.root.style.opacity = "0";
      this.root.style.display = "none";
      this.selectionKey = "";
      this.clearSelectionHighlights();
    }
    destroy() {
      this.clearSelectionHighlights();
      this.root.remove();
    }
    renderSelectionHighlights(color, selectionRects, overlayContainer) {
      const key = selectionRects.map((r) => `${r.left},${r.top},${r.width},${r.height}`).join("|");
      if (key === this.selectionKey) return;
      this.selectionKey = key;
      this.clearSelectionHighlights();
      for (const rect of selectionRects) {
        const highlight = document.createElement("div");
        highlight.className = SELECTION_CLASS;
        highlight.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;background:${color};opacity:0.28;border-radius:2px;pointer-events:none;z-index:2147483644;`;
        overlayContainer.appendChild(highlight);
        this.selectionHighlights.push(highlight);
      }
    }
    clearSelectionHighlights() {
      for (const el of this.selectionHighlights) el.remove();
      this.selectionHighlights = [];
    }
  };
  function ensureCursorStyles() {
    if (document.getElementById("lowcoder-cursor-presence-styles")) return;
    const style = document.createElement("style");
    style.id = "lowcoder-cursor-presence-styles";
    style.textContent = `
    .${CURSOR_CLASS} { contain: layout style; }
    .${LABEL_CLASS} { box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
    .${CARET_CLASS} { animation: lowcoder-cursor-blink 1s step-end infinite; }
    @keyframes lowcoder-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  `;
    document.head.appendChild(style);
  }

  // src/bridge/cursor-presence/CursorOverlay.ts
  var LERP_FACTOR = 0.35;
  var CursorOverlay = class {
    constructor(options) {
      this.options = options;
      this.cursors = /* @__PURE__ */ new Map();
      this.renderStates = /* @__PURE__ */ new Map();
      this.rafId = null;
      this.destroyed = false;
      ensureCursorStyles();
      this.container = document.createElement("div");
      this.container.id = "lowcoder-cursor-overlay";
      this.container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:visible;";
      document.documentElement.appendChild(this.container);
      this.startAnimationLoop();
    }
    /**
     * Render cursors for other connected users only.
     * The local typist never sees their own collaborative caret/label.
     * Null / inactive remote cursors are hidden (no time-based timeout).
     */
    syncFromAwareness(awareness) {
      const localClientId = awareness.clientID;
      const localUserId = this.options.localUserId;
      const active = /* @__PURE__ */ new Set();
      awareness.getStates().forEach((rawState, clientId) => {
        if (clientId === localClientId) return;
        const state = rawState;
        if (!state?.user) return;
        if (state.user.id === localUserId) return;
        if (!this.isActiveRemoteCursor(state.cursor)) {
          this.removeRemote(clientId);
          return;
        }
        active.add(clientId);
        this.upsertRemoteState(clientId, state.user, state.cursor);
      });
      for (const clientId of this.cursors.keys()) {
        if (!active.has(clientId)) this.removeRemote(clientId);
      }
      this.renderAll();
    }
    isActiveRemoteCursor(cursor) {
      return cursor != null && cursor.typing === true;
    }
    upsertRemoteState(clientId, user, cursor) {
      const existing = this.renderStates.get(clientId);
      const metrics = this.resolveCursorMetrics(cursor);
      const hasCursor = cursor?.typing === true && metrics != null;
      this.renderStates.set(clientId, {
        clientId,
        user,
        cursor,
        x: existing?.x ?? metrics?.x ?? 0,
        y: existing?.y ?? metrics?.y ?? 0,
        targetX: metrics?.x ?? existing?.targetX ?? 0,
        targetY: metrics?.y ?? existing?.targetY ?? 0,
        height: metrics?.height ?? existing?.height ?? 16,
        selectionRects: metrics?.selectionRects ?? [],
        online: hasCursor
      });
      if (!this.cursors.has(clientId)) {
        const remoteCursor = new RemoteCursor(clientId);
        remoteCursor.mount(this.container);
        this.cursors.set(clientId, remoteCursor);
      }
    }
    removeRemote(clientId) {
      this.renderStates.delete(clientId);
      this.cursors.get(clientId)?.destroy();
      this.cursors.delete(clientId);
    }
    resolveField(key) {
      return findFieldByCursorKey(
        key,
        this.options.getCurrentStep(),
        this.options.findFieldByKey
      );
    }
    resolveCursorMetrics(cursor) {
      if (!this.isActiveRemoteCursor(cursor)) return null;
      if (cursor.step !== this.options.getCurrentStep()) return null;
      const field = this.resolveField(cursor.fieldKey);
      if (!field?.isConnected) return null;
      let caret = getCaretCoordinatesForField(field, cursor.selection.head) ?? getFieldFallbackCaret(field);
      if (!caret || !Number.isFinite(caret.left)) {
        caret = getFieldFallbackCaret(field);
      }
      return {
        x: caret.left,
        y: caret.top,
        height: caret.height,
        selectionRects: getSelectionRectsForField(
          field,
          cursor.selection.anchor,
          cursor.selection.head
        )
      };
    }
    renderAll() {
      for (const state of this.renderStates.values()) {
        this.cursors.get(state.clientId)?.update(state, this.container);
      }
    }
    startAnimationLoop() {
      const tick = () => {
        if (this.destroyed) return;
        for (const state of this.renderStates.values()) {
          const dx = state.targetX - state.x;
          const dy = state.targetY - state.y;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            state.x += dx * LERP_FACTOR;
            state.y += dy * LERP_FACTOR;
          } else {
            state.x = state.targetX;
            state.y = state.targetY;
          }
          this.cursors.get(state.clientId)?.updatePosition(state.x, state.y);
        }
        this.rafId = window.requestAnimationFrame(tick);
      };
      this.rafId = window.requestAnimationFrame(tick);
    }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      if (this.rafId != null) window.cancelAnimationFrame(this.rafId);
      for (const cursor of this.cursors.values()) cursor.destroy();
      this.cursors.clear();
      this.renderStates.clear();
      this.container.remove();
      destroyCaretMirror();
    }
  };

  // src/bridge/cursor-presence/initTypeformCursorPresence.ts
  var TYPING_IDLE_MS = 2500;
  function readUserName(editorId) {
    const params2 = new URLSearchParams(window.location.search);
    return params2.get("username") || document.documentElement.getAttribute("data-lowcoder-username") || editorId;
  }
  function isRealUserActivity(event) {
    return event.isTrusted === true;
  }
  function initTypeformCursorPresence(config) {
    const userName = readUserName(config.editorId);
    const user = {
      id: config.editorId,
      name: userName,
      color: getUserColor(config.editorId),
      role: config.role
    };
    const canBroadcast = () => !config.isWelcomeScreen() && !(config.isSyncing?.() ?? false);
    const overlay = new CursorOverlay({
      findFieldByKey: config.findFieldByKey,
      getCurrentStep: config.getCurrentStep,
      localUserId: config.editorId
    });
    const presence = new CursorPresenceProvider(
      config.provider,
      user,
      () => {
        presence.syncOverlayFromAwareness((awareness) => overlay.syncFromAwareness(awareness));
      },
      33
    );
    let isActive = false;
    let idleTimer;
    const clearCursor = () => {
      isActive = false;
      window.clearTimeout(idleTimer);
      idleTimer = void 0;
      presence.setLocalCursor(null);
    };
    const syncOverlay = () => {
      presence.syncOverlayFromAwareness((awareness) => overlay.syncFromAwareness(awareness));
    };
    const scheduleIdleClear = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        clearCursor();
        syncOverlay();
      }, TYPING_IDLE_MS);
    };
    const publishCursor = () => {
      if (!isActive) return;
      if (!canBroadcast()) return;
      const field = getFocusedTextField();
      if (!field) return;
      const step = config.getCurrentStep();
      presence.setLocalCursor({
        fieldKey: getCursorFieldKey(field, step, config.getFieldKey),
        step,
        selection: getFieldSelection(field),
        typing: true,
        updatedAt: Date.now()
      });
    };
    const activateCursor = (event) => {
      if (!isRealUserActivity(event)) return;
      if (!canBroadcast()) return;
      const target = event.target;
      if (target instanceof Element && !isTextFieldElement(target) && !getFocusedTextField()) {
        return;
      }
      if (!getFocusedTextField()) return;
      isActive = true;
      publishCursor();
      scheduleIdleClear();
    };
    const listenerOpts = { capture: true, passive: true };
    const onInput = (event) => activateCursor(event);
    const onCompositionUpdate = (event) => activateCursor(event);
    const onKeyDown = (event) => {
      if (!isRealUserActivity(event)) return;
      if (!getFocusedTextField()) return;
      activateCursor(event);
    };
    const onSelectionChange = () => {
      if (!isActive) return;
      publishCursor();
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!getFocusedTextField()) clearCursor();
      }, 0);
    };
    const onScroll = () => {
      if (isActive) publishCursor();
      syncOverlay();
    };
    const onResize = () => syncOverlay();
    document.addEventListener("input", onInput, listenerOpts);
    document.addEventListener("compositionupdate", onCompositionUpdate, listenerOpts);
    document.addEventListener("keydown", onKeyDown, listenerOpts);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("focusout", onFocusOut, listenerOpts);
    document.addEventListener("scroll", onScroll, listenerOpts);
    window.addEventListener("resize", onResize, { passive: true });
    let layoutTimer;
    const domObserver = new MutationObserver(() => {
      window.clearTimeout(layoutTimer);
      layoutTimer = window.setTimeout(() => {
        if (isActive) publishCursor();
        syncOverlay();
      }, 100);
    });
    domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true
    });
    const pollTimer = window.setInterval(() => {
      if (isActive) publishCursor();
      syncOverlay();
    }, 100);
    const onProviderStatus = () => syncOverlay();
    config.provider.on("synced", onProviderStatus);
    presence.setLocalCursor(null);
    syncOverlay();
    if (config.debug) {
      console.log("[typeform-cursor-presence] started (idle-clear, no sync-clear)", {
        userName,
        editorId: config.editorId
      });
    }
    const destroy = () => {
      window.clearInterval(pollTimer);
      window.clearTimeout(layoutTimer);
      window.clearTimeout(idleTimer);
      config.provider.off("synced", onProviderStatus);
      document.removeEventListener("input", onInput, listenerOpts);
      document.removeEventListener("compositionupdate", onCompositionUpdate, listenerOpts);
      document.removeEventListener("keydown", onKeyDown, listenerOpts);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("focusout", onFocusOut, listenerOpts);
      document.removeEventListener("scroll", onScroll, listenerOpts);
      window.removeEventListener("resize", onResize);
      domObserver.disconnect();
      clearCursor();
      presence.destroy();
      overlay.destroy();
    };
    window.addEventListener("beforeunload", destroy, { once: true });
    return destroy;
  }

  // src/bridge/typeform-bridge.ts
  (() => {
    const pageParams = new URLSearchParams(window.location.search);
    const roomId = pageParams.get("roomId") || document.documentElement.getAttribute("data-lowcoder-room-id") || "";
    const role = pageParams.get("role") || document.documentElement.getAttribute("data-lowcoder-role") || "driver";
    const editorId = pageParams.get("editorId") || document.documentElement.getAttribute("data-lowcoder-editor-id") || "local";
    const peerId = `${editorId}|${role}|${Math.random().toString(36).slice(2, 10)}`;
    const collabId = pageParams.get("collab") || document.documentElement.getAttribute("data-lowcoder-collab-id") || "default";
    const debug = pageParams.get("debug") === "1";
    const hocuspocusConfig = window.__LOWCODER_HOCUSPOCUS__ ?? {};
    const hocuspocusUrl = hocuspocusConfig.url || document.documentElement.getAttribute("data-lowcoder-hocuspocus-url") || "ws://localhost:3006";
    const hocuspocusToken = hocuspocusConfig.token || document.documentElement.getAttribute("data-lowcoder-hocuspocus-token") || "";
    const documentName = `typeform_${roomId}_${collabId}`;
    let version = 0;
    let lastAppliedVersion = 0;
    let localStep = 0;
    let isApplyingRemoteState = false;
    let lastSentPayload = "";
    let sessionStarted = false;
    let welcomeClickPending = false;
    let providerReady = false;
    let lastNavAt = 0;
    let lastLocalInputAt = 0;
    let isApplyingInputText = false;
    let publishInputTimer;
    let applyingGeneration = 0;
    const outboundQueue = [];
    let allAnswers = {};
    const doc2 = new Doc();
    const stateMap = doc2.getMap("state");
    const provider = new HocuspocusProvider({
      url: hocuspocusUrl,
      name: documentName,
      document: doc2,
      token: hocuspocusToken || void 0,
      onAuthenticationFailed: (data) => {
        console.error("[typeform-bridge] Hocuspocus auth failed", data);
      }
    });
    function log(...args2) {
      if (debug) console.log("[typeform-bridge]", role, ...args2);
    }
    function nextVersion() {
      const remote = Number(stateMap.get("version") || 0);
      version = Math.max(version, remote) + 1;
      return version;
    }
    function publishPatch(patch) {
      if (!providerReady) {
        outboundQueue.push(patch);
        return;
      }
      doc2.transact(() => {
        if (patch.started) {
          stateMap.set("started", true);
        }
        stateMap.set("version", patch.version);
        stateMap.set("patchJson", JSON.stringify(patch));
      });
      log("published", {
        version: patch.version,
        step: patch.currentStep,
        nav: patch.nav,
        q: patch.questionKey
      });
    }
    function flushOutboundQueue() {
      while (outboundQueue.length > 0) {
        const patch = outboundQueue.shift();
        if (patch) publishPatch(patch);
      }
    }
    function parseRemotePatch() {
      const raw = stateMap.get("patchJson");
      if (typeof raw !== "string" || !raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    function shouldApplyPatch(patch) {
      if (!patch) return false;
      if (patch.lastEditor === peerId) return false;
      if ((patch.version ?? 0) <= lastAppliedVersion && patch.currentStep === localStep) {
        return false;
      }
      return true;
    }
    function syncFromRemoteState() {
      const started = Boolean(stateMap.get("started"));
      const patch = parseRemotePatch();
      if (started && !sessionStarted && role === "follower") {
        onRemoteSessionStarted();
      }
      if (patch && shouldApplyPatch(patch)) {
        applyRemoteState(patch);
      }
      applyRemoteInputText();
    }
    provider.on("status", ({ status }) => {
      log("status", status, documentName);
      if (status === WebSocketStatus.Connected) {
        providerReady = true;
        flushOutboundQueue();
        syncFromRemoteState();
      }
    });
    provider.on("synced", () => {
      providerReady = true;
      flushOutboundQueue();
      syncFromRemoteState();
    });
    stateMap.observe((event) => {
      if (event.keysChanged.has("patchJson") || event.keysChanged.has("version") || event.keysChanged.has("started") || event.keysChanged.has("inputTextJson") || event.keysChanged.has("inputTextsJson")) {
        syncFromRemoteState();
      }
    });
    function isVisible2(el) {
      const node = el;
      if (!node.getBoundingClientRect) return true;
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    function listVisibleTextFields(container = document) {
      return Array.from(
        container.querySelectorAll(
          [
            'input[type="text"]',
            'input[type="email"]',
            'input[type="number"]',
            'input[type="tel"]',
            'input[type="url"]',
            'input[type="search"]',
            'input[type="short_text"]',
            'input[type="long_text"]',
            'input[type="phone_number"]',
            "input[name]",
            "input:not([type])",
            "textarea"
          ].join(", ")
        )
      ).filter((field) => {
        const type = (field.getAttribute("type") || field.type || "").toLowerCase();
        if (["hidden", "checkbox", "radio", "button", "submit", "file", "password"].includes(type)) {
          return false;
        }
        return isVisible2(field);
      });
    }
    function getFocusedTextField2() {
      const el = document.activeElement;
      if (!el) return null;
      if (el instanceof HTMLInputElement) {
        const type = (el.getAttribute("type") || el.type || "text").toLowerCase();
        if (["hidden", "checkbox", "radio", "button", "submit", "file", "password"].includes(type)) {
          return null;
        }
        return el;
      }
      if (el instanceof HTMLTextAreaElement) return el;
      return null;
    }
    function extractQuestionUuid2(value) {
      const match2 = value.match(
        /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
      );
      return match2?.[1] ?? null;
    }
    function getFieldKey(field) {
      const name = field.getAttribute("name")?.trim();
      if (name) return `name:${name}`;
      const labelledBy = field.getAttribute("aria-labelledby") || "";
      const fromLabel = extractQuestionUuid2(labelledBy);
      if (fromLabel) return `qid:${fromLabel}`;
      const id2 = field.getAttribute("id") || "";
      const fromId = extractQuestionUuid2(id2);
      if (fromId) return `qid:${fromId}`;
      const typeAttr = (field.getAttribute("type") || field.type || "text").toLowerCase();
      return `type:${typeAttr}:step:${localStep}`;
    }
    function findFieldByKey(key) {
      const visible = listVisibleTextFields(document);
      for (const field of visible) {
        if (getFieldKey(field) === key) return field;
      }
      if (key.startsWith("name:")) {
        const name = key.slice("name:".length);
        const el = document.querySelector(`input[name="${CSS.escape(name)}"]`);
        if (el && isVisible2(el)) return el;
      }
      if (key.startsWith("qid:")) {
        const qid = key.slice("qid:".length);
        const matches = Array.from(
          document.querySelectorAll(
            `input[aria-labelledby*="${CSS.escape(qid)}"], input[id*="${CSS.escape(qid)}"], textarea[aria-labelledby*="${CSS.escape(qid)}"]`
          )
        ).filter(isVisible2);
        if (matches[0]) return matches[0];
      }
      return null;
    }
    function getActiveQuestionContainer() {
      const candidates = [
        '[data-qa="question-container"]',
        '[data-qa="question"]',
        "fieldset",
        '[role="group"]'
      ];
      for (const selector of candidates) {
        const nodes = Array.from(document.querySelectorAll(selector)).filter(isVisible2);
        if (nodes.length > 0) {
          return nodes[nodes.length - 1];
        }
      }
      return null;
    }
    function readInputTextsMap() {
      const raw = stateMap.get("inputTextsJson");
      if (typeof raw !== "string" || !raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    function syncAllAnswersForField(fieldKey, text2) {
      const qKey = stepKey(localStep);
      const container = getActiveQuestionContainer() || document;
      listVisibleTextFields(container).forEach((field, index) => {
        if (getFieldKey(field) === fieldKey) {
          allAnswers[`${qKey}::field-${index}`] = text2;
        }
      });
    }
    function publishInputText() {
      if (!canPublish()) return;
      if (isApplyingInputText || isApplyingRemoteState) return;
      const field = getFocusedTextField2() || listVisibleTextFields(document)[0];
      if (!field) return;
      const fieldKey = getFieldKey(field);
      const text2 = field.value;
      const remoteMap = readInputTextsMap();
      if ((remoteMap[fieldKey] ?? "") === text2) return;
      if (!providerReady) return;
      syncAllAnswersForField(fieldKey, text2);
      const nextMap = { ...remoteMap, [fieldKey]: text2 };
      const payload = {
        fieldKey,
        step: localStep,
        text: text2,
        peerId,
        version: nextVersion()
      };
      doc2.transact(() => {
        stateMap.set("inputTextJson", JSON.stringify(payload));
        stateMap.set("inputTextsJson", JSON.stringify(nextMap));
        stateMap.set("version", payload.version);
      });
      log("published input text", payload);
    }
    function schedulePublishInputText() {
      lastLocalInputAt = Date.now();
      window.clearTimeout(publishInputTimer);
      publishInputTimer = window.setTimeout(() => {
        publishInputText();
      }, 120);
    }
    function flushPublishInputText() {
      window.clearTimeout(publishInputTimer);
      publishInputText();
    }
    function readLatestInputPayload() {
      const raw = stateMap.get("inputTextJson");
      if (typeof raw !== "string" || !raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    function applyRemoteInputText() {
      if (isOnWelcomeScreen()) return;
      if (isApplyingInputText) return;
      const map2 = readInputTextsMap();
      const visible = listVisibleTextFields(document);
      const latestInput = readLatestInputPayload();
      const locallyTyping = Date.now() - lastLocalInputAt < 800;
      isApplyingInputText = true;
      try {
        for (const field of visible) {
          const key = getFieldKey(field);
          if (!Object.prototype.hasOwnProperty.call(map2, key)) continue;
          if (locallyTyping && document.activeElement === field) continue;
          const next = map2[key] ?? "";
          if (latestInput?.peerId === peerId && latestInput.fieldKey === key && document.activeElement === field && field.value !== next) {
            continue;
          }
          if (field.value === next) continue;
          setNativeInputValue(field, next);
          log("applied field text", key, next);
        }
        const payload = latestInput;
        if (payload && payload.peerId !== peerId && typeof payload.text === "string" && payload.fieldKey) {
          const target = findFieldByKey(payload.fieldKey);
          if (target && !(locallyTyping && document.activeElement === target) && target.value !== payload.text) {
            setNativeInputValue(target, payload.text);
            log("applied field text (payload)", payload.fieldKey, payload.text);
          }
        }
      } finally {
        window.setTimeout(() => {
          isApplyingInputText = false;
        }, 50);
      }
    }
    function stepKey(step) {
      return `question-${Math.max(0, step)}`;
    }
    function collectVisibleAnswersForKey(qKey) {
      const result = {};
      const container = getActiveQuestionContainer() || document;
      listVisibleTextFields(container).forEach((field, index) => {
        result[`${qKey}::field-${index}`] = field.value;
      });
      container.querySelectorAll(
        '[data-qa*="choice"], [role="radio"], [role="checkbox"], [role="option"], button[data-qa]'
      ).forEach((el, index) => {
        const selected = el.getAttribute("aria-checked") === "true" || el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-selected") === "true" || el.classList.contains("selected");
        if (!selected) return;
        const value = el.getAttribute("data-qa") || el.textContent?.trim() || String(index);
        result[`${qKey}::choice`] = value;
      });
      return result;
    }
    function collectAnswers(forStep = localStep) {
      const visible = collectVisibleAnswersForKey(stepKey(forStep));
      allAnswers = { ...allAnswers, ...visible };
      return allAnswers;
    }
    function getFormId() {
      const target = pageParams.get("target");
      if (target) {
        try {
          const match3 = new URL(target).pathname.match(/\/to\/([^/?#]+)/);
          if (match3?.[1]) return match3[1];
        } catch {
        }
      }
      const match2 = window.location.pathname.match(/\/to\/([^/?#]+)/);
      return match2?.[1] ?? "";
    }
    function isOnWelcomeScreen() {
      return !!(document.querySelector('[data-qa="start-button"]') || document.querySelector('[data-qa="welcome-screen"]') || document.querySelector('[data-qa="landing-wrapper"]') || document.querySelector('[data-qa="welcome-screen-paragraph"]'));
    }
    function buttonText(el) {
      return (el.textContent ?? "").trim().toLowerCase();
    }
    function isStartButton(el) {
      if (!el) return false;
      const button = el.closest('button, [role="button"], a');
      if (!button) return false;
      const qa = button.getAttribute("data-qa") ?? "";
      if (/start/i.test(qa)) return true;
      const text2 = buttonText(button);
      return text2 === "start" || text2 === "begin" || text2 === "get started" || text2.includes("start");
    }
    function isSubmitButton(el) {
      if (!el) return false;
      const button = el.closest('button, [role="button"], a, input');
      if (!button) return false;
      const qa = (button.getAttribute("data-qa") ?? "").toLowerCase();
      const aria = (button.getAttribute("aria-label") ?? "").toLowerCase();
      const type = (button.getAttribute("type") ?? "").toLowerCase();
      if (/submit/i.test(qa) || /submit/i.test(aria) || type === "submit") return true;
      const text2 = buttonText(button);
      return text2 === "submit" || text2 === "done" || text2 === "send" || text2 === "finish";
    }
    function isOkButton(el) {
      if (!el) return false;
      const button = el.closest('button, [role="button"]');
      if (!button) return false;
      if (isBackButton(button)) return false;
      const qa = button.getAttribute("data-qa") ?? "";
      if (/ok-button|submit-button|next/i.test(qa)) return true;
      const text2 = buttonText(button);
      return ["ok", "next", "continue", "submit", "done"].includes(text2);
    }
    function isBackButton(el) {
      if (!el) return false;
      const button = el.closest('button, [role="button"], a');
      if (!button) return false;
      const qa = (button.getAttribute("data-qa") ?? "").toLowerCase();
      const aria = (button.getAttribute("aria-label") ?? "").toLowerCase();
      const title = (button.getAttribute("title") ?? "").toLowerCase();
      if (/prev|previous|back/.test(qa) || /prev|previous|back/.test(aria) || /prev|previous|back/.test(title)) {
        return true;
      }
      const text2 = buttonText(button);
      return text2 === "previous" || text2 === "prev" || text2 === "back" || text2 === "\u2190";
    }
    function clickOkButton(allowSubmit = false) {
      const selectors = [
        '[data-qa="ok-button-visible"]',
        '[data-qa="ok-button"]',
        '[data-qa*="next"]'
      ];
      if (allowSubmit) {
        selectors.splice(1, 0, '[data-qa="submit-button"]');
      }
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && isVisible2(btn) && !isBackButton(btn)) {
          if (!allowSubmit && isSubmitButton(btn)) continue;
          btn.click();
          return true;
        }
      }
      const fallback = Array.from(document.querySelectorAll("button, [role='button']")).find(
        (btn) => {
          if (!isVisible2(btn) || isBackButton(btn)) return false;
          if (!allowSubmit && isSubmitButton(btn)) return false;
          const text2 = buttonText(btn);
          return ["ok", "next", "continue"].includes(text2) || allowSubmit && ["submit", "done"].includes(text2);
        }
      );
      if (fallback) {
        fallback.click();
        return true;
      }
      return false;
    }
    function clickBackButton() {
      const selectors = [
        '[data-qa*="previous"]',
        '[data-qa*="prev"]',
        '[data-qa*="back"]',
        '[aria-label*="Previous" i]',
        '[aria-label*="Back" i]',
        '[title*="Previous" i]',
        '[title*="Back" i]'
      ];
      for (const selector of selectors) {
        try {
          const btn = document.querySelector(selector);
          if (btn && isVisible2(btn)) {
            btn.click();
            return true;
          }
        } catch {
        }
      }
      const fallback = Array.from(document.querySelectorAll("button, [role='button'], a")).find(
        (btn) => isVisible2(btn) && isBackButton(btn)
      );
      if (fallback) {
        fallback.click();
        return true;
      }
      return false;
    }
    function advancePastWelcomeIfNeeded() {
      if (!isOnWelcomeScreen()) return;
      const startButton = document.querySelector(
        '[data-qa="start-button"]'
      );
      if (startButton) {
        startButton.click();
        return;
      }
      const fallback = Array.from(document.querySelectorAll("button, [role='button']")).find(
        (node) => isStartButton(node)
      );
      fallback?.click();
    }
    function buildPatch(opts = {}) {
      const answeredStep = opts.answeredStep ?? localStep;
      const current = opts.currentStep ?? localStep;
      return {
        formId: getFormId(),
        answers: collectAnswers(answeredStep),
        currentStep: current,
        questionKey: stepKey(answeredStep),
        version: nextVersion(),
        lastEditor: peerId,
        submitted: Boolean(opts.submitted),
        started: true,
        nav: opts.nav ?? "answer"
      };
    }
    function markSessionStarted() {
      if (sessionStarted) return;
      sessionStarted = true;
      welcomeClickPending = false;
      localStep = 0;
      if (role === "driver") {
        const startedPatch = buildPatch({ currentStep: 0, answeredStep: 0, nav: "start" });
        publishPatch(startedPatch);
        log("session started (local)");
      }
    }
    function onRemoteSessionStarted() {
      if (sessionStarted) return;
      sessionStarted = true;
      localStep = 0;
      if (role === "follower") {
        advancePastWelcomeIfNeeded();
        log("session started (remote)");
      }
    }
    function canPublish() {
      return sessionStarted && !isApplyingRemoteState;
    }
    function sendPatch(submitted = false) {
      if (!canPublish()) return;
      const payload = buildPatch({
        submitted,
        answeredStep: localStep,
        currentStep: localStep,
        nav: "answer"
      });
      const serialized = JSON.stringify({
        answers: payload.answers,
        currentStep: payload.currentStep,
        submitted: payload.submitted,
        nav: payload.nav
      });
      if (serialized === lastSentPayload && !submitted) return;
      lastSentPayload = serialized;
      publishPatch(payload);
    }
    function publishNext(fromStep, submitted = false) {
      if (!canPublish()) return;
      const now = Date.now();
      if (!submitted && now - lastNavAt < 350) return;
      lastNavAt = now;
      const payload = buildPatch({
        submitted,
        answeredStep: fromStep,
        currentStep: fromStep + 1,
        nav: "next"
      });
      localStep = fromStep + 1;
      lastSentPayload = "";
      lastAppliedVersion = Math.max(lastAppliedVersion, payload.version);
      publishPatch(payload);
      log("next", fromStep, "->", localStep);
      window.setTimeout(() => applyRemoteInputText(), 300);
    }
    function publishPrev(fromStep) {
      if (!canPublish()) return;
      if (fromStep <= 0) return;
      const now = Date.now();
      if (now - lastNavAt < 350) return;
      lastNavAt = now;
      const payload = buildPatch({
        answeredStep: fromStep,
        currentStep: fromStep - 1,
        nav: "prev"
      });
      localStep = fromStep - 1;
      lastSentPayload = "";
      lastAppliedVersion = Math.max(lastAppliedVersion, payload.version);
      publishPatch(payload);
      log("prev", fromStep, "->", localStep);
      window.setTimeout(() => applyRemoteInputText(), 300);
    }
    function applyChoice(value) {
      const container = getActiveQuestionContainer() || document;
      const choices = container.querySelectorAll(
        '[data-qa*="choice"], [role="radio"], [role="checkbox"], [role="option"], button[data-qa]'
      );
      for (const el of choices) {
        if (!isVisible2(el)) continue;
        const label = el.textContent?.trim() || "";
        const qa = el.getAttribute("data-qa") || "";
        if (qa === value || label === value || qa.includes(value) || label.includes(value)) {
          el.click();
          return true;
        }
      }
      return false;
    }
    function setNativeInputValue(field, nextValue) {
      if (field.value === nextValue) return;
      const previous = field.value;
      const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      const tracker = field._valueTracker;
      if (tracker) {
        tracker.setValue(previous);
      }
      if (setter) {
        setter.call(field, nextValue);
      } else {
        field.value = nextValue;
      }
      const inputType = nextValue.length < previous.length ? "deleteContentBackward" : nextValue.length > previous.length ? "insertText" : "insertReplacementText";
      field.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          data: inputType === "insertText" ? nextValue.slice(previous.length) : nextValue,
          inputType
        })
      );
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
    function applyAnswersForQuestion(answers, questionKey) {
      const container = getActiveQuestionContainer() || document;
      Object.entries(answers).forEach(([key, value]) => {
        if (!key.startsWith(`${questionKey}::`)) return;
        if (key.endsWith("::choice")) {
          applyChoice(String(value ?? ""));
          return;
        }
        if (key.includes("::field-")) {
          const index = Number(key.split("::field-")[1] ?? 0);
          const field = listVisibleTextFields(container)[index];
          if (!field) return;
          const fieldKey = getFieldKey(field);
          const inputTexts = readInputTextsMap();
          if (Object.prototype.hasOwnProperty.call(inputTexts, fieldKey)) return;
          if (document.activeElement === field && Date.now() - lastLocalInputAt < 800) return;
          setNativeInputValue(field, value == null ? "" : String(value));
        }
      });
    }
    function alignToRemoteStep(patch, generation) {
      if (generation !== applyingGeneration) return;
      const remoteStep = Math.max(0, patch.currentStep ?? 0);
      if (localStep === remoteStep) {
        applyAnswersForQuestion(patch.answers, stepKey(localStep));
        lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
        isApplyingRemoteState = false;
        log("aligned on step", localStep);
        window.setTimeout(() => applyRemoteInputText(), 250);
        return;
      }
      if (localStep < remoteStep) {
        applyAnswersForQuestion(patch.answers, stepKey(localStep));
        window.setTimeout(() => {
          if (generation !== applyingGeneration) return;
          const allowSubmit = Boolean(patch.submitted) && localStep + 1 >= remoteStep;
          const advanced = clickOkButton(allowSubmit);
          if (!advanced) {
            lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
            isApplyingRemoteState = false;
            log("catch-up stopped: no next control", localStep, "target", remoteStep);
            return;
          }
          localStep += 1;
          log("catch-up next ->", localStep, "target", remoteStep);
          window.setTimeout(() => alignToRemoteStep(patch, generation), 450);
        }, 180);
        return;
      }
      window.setTimeout(() => {
        if (generation !== applyingGeneration) return;
        const moved = clickBackButton();
        if (moved) {
          localStep = Math.max(0, localStep - 1);
          log("catch-up prev ->", localStep, "target", remoteStep);
        } else {
          localStep = remoteStep;
          applyAnswersForQuestion(patch.answers, stepKey(localStep));
          lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
          isApplyingRemoteState = false;
          return;
        }
        window.setTimeout(() => alignToRemoteStep(patch, generation), 450);
      }, 180);
    }
    function applyRemoteStateInner(patch) {
      if (!patch?.answers && patch.nav === "answer") return;
      applyingGeneration += 1;
      const generation = applyingGeneration;
      isApplyingRemoteState = true;
      allAnswers = { ...allAnswers, ...patch.answers || {} };
      alignToRemoteStep(patch, generation);
    }
    function applyRemoteState(patch) {
      if (!sessionStarted) {
        if (role === "driver") return;
        if (!patch.started && !Boolean(stateMap.get("started"))) return;
        sessionStarted = true;
      }
      if (isOnWelcomeScreen()) {
        if (role === "follower" && sessionStarted) {
          advancePastWelcomeIfNeeded();
          window.setTimeout(() => applyRemoteStateInner(patch), 400);
        }
        return;
      }
      applyRemoteStateInner(patch);
    }
    function maybeMarkSessionStartedAfterWelcomeClick() {
      if (role !== "driver" || sessionStarted || !welcomeClickPending) return;
      if (!isOnWelcomeScreen()) {
        markSessionStarted();
      }
    }
    const debounce = /* @__PURE__ */ (() => {
      let timer;
      return () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          maybeMarkSessionStartedAfterWelcomeClick();
          sendPatch(false);
        }, 150);
      };
    })();
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!sessionStarted) {
          if (role === "driver" && isOnWelcomeScreen()) {
            welcomeClickPending = true;
            if (isStartButton(target)) {
              window.setTimeout(() => markSessionStarted(), 0);
            }
          }
          return;
        }
        if (isApplyingRemoteState) return;
        if (isBackButton(target)) {
          publishPrev(localStep);
          return;
        }
        if (isOkButton(target)) {
          publishNext(localStep, isSubmitButton(target));
        }
      },
      true
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (!canPublish()) return;
        if (isOnWelcomeScreen()) return;
        if (event.key === "Enter") {
          window.setTimeout(() => publishNext(localStep, false), 0);
          return;
        }
        if (event.key === "ArrowUp") {
          window.setTimeout(() => publishPrev(localStep), 0);
        }
      },
      true
    );
    new MutationObserver(debounce).observe(document.documentElement, {
      childList: true,
      attributes: true,
      subtree: true
    });
    document.addEventListener(
      "input",
      () => {
        if (isApplyingInputText || isApplyingRemoteState) return;
        schedulePublishInputText();
        debounce();
      },
      true
    );
    document.addEventListener(
      "keyup",
      (event) => {
        if (isApplyingInputText || isApplyingRemoteState) return;
        const key = event.key;
        if (key === "Enter" || key === "ArrowUp" || key === "ArrowDown") return;
        schedulePublishInputText();
      },
      true
    );
    document.addEventListener(
      "blur",
      (event) => {
        if (isApplyingInputText || isApplyingRemoteState) return;
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          flushPublishInputText();
        }
      },
      true
    );
    document.addEventListener("change", debounce, true);
    document.addEventListener(
      "submit",
      (event) => {
        if (isApplyingRemoteState) {
          event.preventDefault();
          event.stopPropagation();
          log("blocked auto-submit during remote sync");
          return;
        }
        if (canPublish()) {
          publishNext(localStep, true);
        }
      },
      true
    );
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args2) => {
      const response = await originalFetch(...args2);
      debounce();
      return response;
    };
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function patchedOpen(...args2) {
      this.addEventListener("loadend", debounce);
      return originalOpen.apply(this, args2);
    };
    log("ready", { role, roomId, collabId, documentName, editorId, peerId });
    initTypeformCursorPresence({
      provider,
      editorId,
      role,
      debug,
      getFieldKey,
      findFieldByKey,
      getCurrentStep: () => localStep,
      getSessionStarted: () => sessionStarted,
      isWelcomeScreen: isOnWelcomeScreen,
      isSyncing: () => isApplyingRemoteState || isApplyingInputText
    });
    window.addEventListener("beforeunload", () => {
      provider.destroy();
      doc2.destroy();
    });
  })();
})();
