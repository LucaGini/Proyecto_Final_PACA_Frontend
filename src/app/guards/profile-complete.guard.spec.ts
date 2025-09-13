import { TestBed } from '@angular/core/testing';
import { ProfileCompleteGuard } from './profile-complete.guard';

describe('ProfileCompleteGuard', () => {
  let guard: ProfileCompleteGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ProfileCompleteGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});