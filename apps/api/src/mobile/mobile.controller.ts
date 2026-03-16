import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MobileService } from './mobile.service';
import { ActiveRoutineResponseDto } from './dto/active-routine-response.dto';

@ApiTags('Mobile Features')
@ApiBearerAuth()
@Controller('mobile')
@UseGuards(AuthGuard('jwt-patient'))
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('routine/active')
  @ApiOperation({ summary: 'Get active routine for logged-in patient' })
  @ApiResponse({
    status: 200,
    description: 'Returns full routine object with exercises',
    type: ActiveRoutineResponseDto,
  })
  async getActiveRoutine(
    @Request() req,
  ): Promise<ActiveRoutineResponseDto | null> {
    return this.mobileService.getActiveRoutine(req.user.id);
  }
}
