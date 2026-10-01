import { describe, expect, it } from 'vitest';
import {
  EMPTY_EYE,
  EMPTY_PATIENT,
  eyeToRequest,
  parseDecimal,
  validateFormula,
  validatePatient,
  type FormulaDraft,
  type PatientDraft,
} from './validation';

const TODAY = new Date('2026-09-29T12:00:00');

const validPatient: PatientDraft = {
  ...EMPTY_PATIENT,
  documentNumber: '1075243890',
  firstName: 'Laura Marcela',
  lastName: 'Ortega Ruiz',
  phone: '3104582291',
  eps: 'Sanitas',
};

const validFormula: FormulaDraft = {
  od: { sphere: '-1,50', cylinder: '-0.75', axis: '90', addition: '' },
  oi: { ...EMPTY_EYE, sphere: '-1.25' },
  pupillaryDistance: '62,5',
  lensType: 'MONOFOCAL',
  optometristName: 'Dra. Ana Torres',
  formulaDate: '2026-09-20',
};

describe('patient validation', () => {
  it('accepts a valid patient', () => {
    expect(validatePatient(validPatient, TODAY)).toEqual({});
  });

  it('names every invalid field at once', () => {
    const errors = validatePatient(
      { ...validPatient, documentNumber: '12', firstName: 'A', lastName: ' ', phone: 'abc', email: 'nope', eps: 'S' },
      TODAY,
    );
    expect(Object.keys(errors).sort()).toEqual(['documentNumber', 'email', 'eps', 'firstName', 'lastName', 'phone']);
  });

  it('rejects future and implausible birth dates but accepts an empty one', () => {
    expect(validatePatient({ ...validPatient, birthDate: '2030-01-01' }, TODAY).birthDate).toBeDefined();
    expect(validatePatient({ ...validPatient, birthDate: '1800-01-01' }, TODAY).birthDate).toBeDefined();
    expect(validatePatient({ ...validPatient, birthDate: '1990-05-20' }, TODAY).birthDate).toBeUndefined();
    expect(validatePatient({ ...validPatient, birthDate: '' }, TODAY).birthDate).toBeUndefined();
  });

  it('accepts a phone with a leading plus', () => {
    expect(validatePatient({ ...validPatient, phone: '+573104582291' }, TODAY).phone).toBeUndefined();
  });
});

describe('formula validation', () => {
  it('accepts a valid formula, with comma or dot decimals', () => {
    expect(validateFormula(validFormula, TODAY)).toEqual({});
  });

  it('requires the axis when there is a cylinder and keeps it between 0 and 180', () => {
    const noAxis = validateFormula({ ...validFormula, od: { ...validFormula.od, axis: '' } }, TODAY);
    expect(noAxis['od.axis']).toBeDefined();
    const tooBig = validateFormula({ ...validFormula, oi: { ...EMPTY_EYE, axis: '181' } }, TODAY);
    expect(tooBig['oi.axis']).toBeDefined();
    const decimalAxis = validateFormula({ ...validFormula, oi: { ...EMPTY_EYE, axis: '90.5' } }, TODAY);
    expect(decimalAxis['oi.axis']).toBeDefined();
  });

  it('keeps diopters in range and in steps of 0.25', () => {
    expect(validateFormula({ ...validFormula, od: { ...validFormula.od, sphere: '-1.3' } }, TODAY)['od.sphere']).toBeDefined();
    expect(validateFormula({ ...validFormula, od: { ...validFormula.od, sphere: '25' } }, TODAY)['od.sphere']).toBeDefined();
    expect(validateFormula({ ...validFormula, oi: { ...EMPTY_EYE, addition: '5' } }, TODAY)['oi.addition']).toBeDefined();
    expect(validateFormula({ ...validFormula, oi: { ...EMPTY_EYE, sphere: 'x' } }, TODAY)['oi.sphere']).toBeDefined();
  });

  it('validates the pupillary distance, lens type, optometrist and date', () => {
    const errors = validateFormula(
      { ...validFormula, pupillaryDistance: '90', lensType: '', optometristName: 'Dr', formulaDate: '2030-01-01' },
      TODAY,
    );
    expect(Object.keys(errors).sort()).toEqual(['formulaDate', 'lensType', 'optometristName', 'pupillaryDistance']);
  });
});

describe('number parsing', () => {
  it('reads decimals typed with comma or dot and rejects the rest', () => {
    expect(parseDecimal('-1,25')).toBe(-1.25);
    expect(parseDecimal('62.5')).toBe(62.5);
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('1e3')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
  });

  it('turns an eye draft into the API shape with nulls for the empty fields', () => {
    expect(eyeToRequest({ sphere: '-1,5', cylinder: '', axis: '', addition: '' })).toEqual({
      sphere: -1.5,
      cylinder: null,
      axis: null,
      addition: null,
    });
  });
});
