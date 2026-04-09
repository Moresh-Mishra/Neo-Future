import sys
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv('MONGO_URI')

print(f"Testing connection to: {MONGO_URI[:50]}...")
print("\nAttempting connection with various SSL configurations...\n")

# Test 1: With tlsAllowInvalidCertificates
print("Test 1: tlsAllowInvalidCertificates=True")
try:
    client = MongoClient(
        MONGO_URI,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=10000
    )
    result = client.admin.command('ping')
    print(f"✓ SUCCESS: {result}")
    client.close()
except Exception as e:
    print(f"✗ FAILED: {type(e).__name__}: {str(e)[:100]}")

# Test 2: With both tlsAllowInvalidCertificates and tlsAllowInvalidHostnames
print("\nTest 2: tlsAllowInvalidCertificates + tlsAllowInvalidHostnames")
try:
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=10000
    )
    result = client.admin.command('ping')
    print(f"✓ SUCCESS: {result}")
    client.close()
except Exception as e:
    print(f"✗ FAILED: {type(e).__name__}: {str(e)[:100]}")

# Test 3: Default settings
print("\nTest 3: Default settings (no SSL options)")
try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000
    )
    result = client.admin.command('ping')
    print(f"✓ SUCCESS: {result}")
    client.close()
except Exception as e:
    print(f"✗ FAILED: {type(e).__name__}: {str(e)[:100]}")

print("\n" + "="*60)
print("TROUBLESHOOTING CHECKLIST:")
print("="*60)
print("1. MongoDB Atlas IP Whitelist:")
print("   - Go to Network Access in MongoDB Atlas")
print("   - Add your current IP address or use 0.0.0.0/0 for testing")
print("\n2. Cluster Status:")
print("   - Go to Clusters in MongoDB Atlas")
print("   - Ensure the cluster is running (not paused)")
print("\n3. Credentials:")
print("   - Verify username: mauryabhoomi643_db_user")
print("   - Verify password: kmZVXX3MKHZq3OOH")
print("   - Check Database Access in MongoDB Atlas")
print("\n4. Network:")
print("   - Check if your firewall/antivirus is blocking port 27017")
print("   - Try disabling VPN if you're using one")
print("="*60)
