import sys
import traceback
try:
    from dashboard import app
except Exception:
    traceback.print_exc()
    sys.exit(1)
