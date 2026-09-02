import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
const string = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export class SearchProfilesQuery {
  @IsOptional() @IsString() @MaxLength(200) @Transform(string) q?: string;
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(string)
  jobTitle?: string;
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      : typeof value === 'string'
        ? value.split(',')
        : value,
  )
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  skills?: string[];
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
