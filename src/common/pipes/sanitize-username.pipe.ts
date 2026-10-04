import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SanitizeUsernamePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    if (value && typeof value === 'object' && typeof value.username === 'string') {
      value.username = value.username.trim().toLowerCase();
    }
    return value;
  }
}
