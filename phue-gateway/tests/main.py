# phue bridge gateway service (testing script)

from tests import test_a, test_b

# target = "192.168.0.100"
target = "phue.anuv.me"
# target = "localhost:8080"



# main
def main():
    print("phue gateway service tests")
    print("")

    # test_a(target)
    test_b(target)

# entry point
if __name__ == "__main__":
    main()
