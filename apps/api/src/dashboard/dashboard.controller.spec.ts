import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should call service.getStats with req.user.userId', async () => {
      const mockStats = {
        metrics: {
          activePatients: { value: 5, trend: 0 },
          complianceAlerts: { value: 2, trend: 0 },
          avgEfficacy: { value: 75, trend: 0 },
        },
        atRiskPatients: [],
      };
      mockDashboardService.getStats.mockResolvedValue(mockStats);

      const mockRequest = {
        user: {
          userId: 'therapist-123',
          email: 'test@example.com',
          role: 'THERAPIST',
        },
      };

      const result = await controller.getStats(mockRequest);

      expect(service.getStats).toHaveBeenCalledWith('therapist-123');
      expect(service.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
    });

    it('should not use req.user.id (which would be undefined)', async () => {
      mockDashboardService.getStats.mockResolvedValue({ metrics: {}, atRiskPatients: [] });

      const mockRequest = {
        user: {
          userId: 'therapist-456',
          email: 'test@example.com',
          role: 'THERAPIST',
        },
      };

      await controller.getStats(mockRequest);

      expect(service.getStats).not.toHaveBeenCalledWith(undefined);
      expect(service.getStats).toHaveBeenCalledWith('therapist-456');
    });
  });
});
