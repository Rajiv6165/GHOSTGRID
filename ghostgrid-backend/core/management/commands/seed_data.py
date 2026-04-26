from django.core.management.base import BaseCommand
from core.models import Board
import uuid


class Command(BaseCommand):
    help = 'Seed the database with sample boards for API testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if boards exist',
        )

    def handle(self, *args, **options):
        # Check if database is empty
        board_count = Board.objects.count()
        
        if board_count > 0 and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    f'Database already contains {board_count} boards. Skipping seeding.'
                )
            )
            return

        # Create sample boards
        sample_boards = [
            'Netflix Architecture',
            'Uber Data Flow', 
            'Twitter Backend'
        ]

        # Create the boards
        created_boards = []
        for board_name in sample_boards:
            try:
                # Create board with auto-generated UUID
                board = Board.objects.create(name=board_name)
                created_boards.append(board)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created board: {board.name} (ID: {board.id})'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to create board {board_name}: {str(e)}'
                    )
                )

        # Print success message
        if len(created_boards) == 3:
            self.stdout.write(
                self.style.SUCCESS(
                    '\nDatabase populated with 3 demo boards!'
                )
            )
            self.stdout.write(
                self.style.NOTICE(
                    '\nCreated boards:\n' +
                    '\n'.join([f'- {board.name} (ID: {board.id})' for board in created_boards])
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'Only {len(created_boards)} boards were created successfully.'
                )
            )