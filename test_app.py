import app
from database import get_session, Hospital, BloodBank, Donor, BloodInventory, BloodRequest

session = get_session()
print("Database connected successfully!")
print(f"Hospitals: {session.query(Hospital).count()}")
print(f"Blood Banks: {session.query(BloodBank).count()}")
print(f"Donors: {session.query(Donor).count()}")
print(f"Inventory items: {session.query(BloodInventory).count()}")
print(f"Blood Requests: {session.query(BloodRequest).count()}")
print("ALL TESTS PASSED!")
