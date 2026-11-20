import { describe, expect, it } from 'vitest';
import { exerciseFormSchema, type ExerciseFormValues } from './exercise-form';
import { toFieldErrors } from './field-errors';

const validExercise: ExerciseFormValues = {
  keyName: 'smile_stretch',
  name: 'Estiramiento de sonrisa',
  description: '',
  type: 'ISOMETRIC',
  category: 'CORE',
  mobileModule: 'SMILE',
  assetAnimationUrl: '',
  assetTutorialVideoUrl: 'https://cdn.example.com/smile.mp4',
};

function fieldErrorsOf(values: ExerciseFormValues) {
  const result = exerciseFormSchema.safeParse(values);
  return result.success ? {} : toFieldErrors(result.error, (key) => key);
}

describe('exerciseFormSchema', () => {
  it('accepts a valid exercise with optional empty URLs', () => {
    expect(exerciseFormSchema.safeParse(validExercise).success).toBe(true);
  });

  it('requires key name and name, and only accepts http(s) URLs', () => {
    expect(
      fieldErrorsOf({ ...validExercise, keyName: ' ', name: '', assetAnimationUrl: 'not a url', assetTutorialVideoUrl: 'ftp://files/x' }),
    ).toEqual({
      keyName: 'keyNameRequired',
      name: 'nameRequired',
      assetAnimationUrl: 'url',
      assetTutorialVideoUrl: 'url',
    });
  });
});
