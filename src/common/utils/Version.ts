
import { chunk } from 'lodash';

type VersionOrCode = number | string | Version

/**
 * 当版本为 2.2.3 时，versionCode 为 20203
 *
 * @export
 * @class Version
 */
export class Version {
  public readonly major: number;
  public readonly min: number;
  public readonly patch: number;

  constructor(versionOrCode: string | number) {
    const [major, min, patch] = this.parseSemverOrCode(versionOrCode);
    this.major = major;
    this.min = min;
    this.patch = patch;
  }

  public toVersionCode() {
    const str = this.padZero(this.major) + this.padZero(this.min) + this.padZero(this.patch);
    return parseInt(str, 10);
  }

  public compareTo(version: VersionOrCode) {
    if (version instanceof Version) {
      return this.toVersionCode() - version.toVersionCode();
    }
    const v = new Version(version);
    return this.toVersionCode() - v.toVersionCode();
  }

  public isGreaterThan(version: VersionOrCode) {
    return this.compareTo(version) > 0;
  }

  public isLessThan(version: VersionOrCode) {
    return this.compareTo(version) < 0;
  }

  public isEqual(version: VersionOrCode) {
    return this.compareTo(version) === 0;
  }

  private padZero(versionNum: number) {
    return versionNum.toString().padStart(2, '0');
  }

  private parseSemver(semver: string) {
    const [major = '0', min = '0', patch = '0'] = semver.split('.');
    return [major, min, patch].map((i) => parseInt(i, 10));
  }
  private parseVersionCode(versionCode: number | string) {
    // 21013  => 02103 补齐6位
    const integer = versionCode.toString().split('.').shift() || '';
    // 21013 => 2.10.13
    const reverseChunk = chunk(integer.padStart(6, '0').split('').reverse(), 2);
    const semver = [...reverseChunk].reverse().map(arr => [...arr].reverse().join('')).join('.');
    return this.parseSemver(semver);
  }

  private parseSemverOrCode(versionOrCode: string | number) {
    const isVersionCode = typeof versionOrCode === 'number' || /^\d+$/.test(versionOrCode);
    return isVersionCode ? this.parseVersionCode(versionOrCode) : this.parseSemver(versionOrCode);
  }
}
