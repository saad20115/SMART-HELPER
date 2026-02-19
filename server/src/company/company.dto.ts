export class CreateCompanyDto {
  name: string;
  crNumber: string;
  email: string;
  phone?: string;
  logoUrl?: string;
}

export class UpdateCompanyDto {
  name?: string;
  crNumber?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
}
