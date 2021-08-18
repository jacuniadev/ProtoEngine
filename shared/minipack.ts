export type ENCODED_ARR = string | number | ENCODED_ARR[];

    const HEADERS = {
        ARRAY: 0,
        STRING: 1,
        I8: 2,
        I16: 3,
        I32: 4,
        U8: 6,
        U16: 7,
        U32: 8,
    };

class _Decode {
    private buffer: Uint8Array;
    private idx = 0;

    decode(buffer: Uint8Array) {
        this.buffer = buffer;
        this.idx = 0;
        return this.decode_type();
    }

    decode_type() {
        const header = this.read_header();
        if (header === HEADERS.STRING) return this.decode_string();
        if (header === HEADERS.ARRAY) return this.decode_array();
        if (header === HEADERS.I8) return this.decode_i8();
        if (header === HEADERS.I16) return this.decode_i16();
        if (header === HEADERS.U8) return this.decode_u8();
        if (header === HEADERS.U16) return this.decode_u16();
    }

    decode_u8() {
        return this.buffer[this.idx++];
    }

    decode_u16() {
        return (this.buffer[this.idx++] << 8) | this.buffer[this.idx++];
    }

    decode_i8() {
        return ((this.decode_u8() + 128) % 128) - 128;
    }

    decode_i16() {
        return ((this.decode_u16() + 32768) % 65536) - 32768;
    }

    decode_array() {
        const length = this.read_header();
        const array = new Array(length);
        for (let i = 0; i < length; i++) {
            array[i] = this.decode_type();
        }
        return array;
    }

    decode_char() {
        return this.buffer[this.idx++];
    }

    decode_string() {
        let str = "";
        for (let i = 0, length = this.read_header(); i < length; i++)
            str += String.fromCharCode(this.decode_char());
        return str;
    }

    read_header() {
        return this.buffer[this.idx++];
    }
}

class _Encode {
    private __default_allocation = 1028;
    private __buffer = new ArrayBuffer(this.__default_allocation);
    private idx = 0;
    private buffer = new Uint8Array(this.__buffer);
    encode(object: Array<ENCODED_ARR>) {
        this.run_encode(object);
        const view = new Uint8Array(this.__buffer, 0, this.idx).slice();
        return (this.idx = 0), view;
    }
    run_encode(object: any) {
        if (Array.isArray(object)) {
            this.encode_array(object);
        } else if (typeof object === "number") {
            this.encode_number(object);
        } else if (typeof object === "string") {
            this.encode_string(object);
        }
    }
    encode_string(str: string) {
        this.buffer[this.idx++] = HEADERS.STRING;
        this.buffer[this.idx++] = str.length;
        for (let i = 0; i < Math.min(0xff, str.length); i++)
            this.buffer[this.idx++] = str[i].charCodeAt(0);
    }
    encode_number(number: number) {
        if (number < 0 && number >= -128) return this.write_i8(number);
        if (number < -128 && number >= -32768) return this.write_i16(number);
        if (number >= 0 && number <= 0xff) return this.write_u8(number);
        if (number > 0xff && number <= 0xffff) return this.write_u16(number);
    }
    encode_array(array: Array<any>) {
        this.buffer[this.idx++] = HEADERS.ARRAY;
        this.buffer[this.idx++] = array.length;
        for (let i = 0; i < array.length; i++) this.run_encode(array[i]);
    }
    write_u8(u8: number) {
        this.buffer[this.idx++] = HEADERS.U8;
        this.buffer[this.idx++] = u8;
    }
    write_i8(i8: number) {
        this.buffer[this.idx++] = HEADERS.I8;
        this.buffer[this.idx++] = i8;
    }
    write_u16(u16: number) {
        this.buffer[this.idx++] = HEADERS.U16;
        this.buffer[this.idx++] = (u16 >> 8) & 0xff;
        this.buffer[this.idx++] = (u16 | 0) & 0xff;
    }
    write_i16(i16: number) {
        this.buffer[this.idx++] = HEADERS.I16;
        this.buffer[this.idx++] = (i16 >> 8) & 0xff;
        this.buffer[this.idx++] = (i16 | 0) & 0xff;
    }
}

export const Encode = new _Encode();
export const Decode = new _Decode();
