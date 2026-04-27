import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// If the request has no valid JWT, it returns a 401 automatically
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
