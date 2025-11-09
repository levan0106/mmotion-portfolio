/**
 * Event emitted when a new user is created
 */
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly username: string,
    public readonly isDemo: boolean = false,
  ) {}
}
