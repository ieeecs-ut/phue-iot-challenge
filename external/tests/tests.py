# phue test routine

from utils import RGBtoXY, EnhanceColor

from phue import Bridge
import json
import math


def test_a(target):
    print("testing connection with target: {}".format(target))
    b = Bridge(target)
    print("")
    print(b.connect())
    print("")
    print(b.get_api())

def test_b(target):
    print("testing with target: {}".format(target))
    bridge = Bridge(target)
    bridge.connect()
    my_lights = bridge.get_light_objects('name')

    my_lights['Big lamp'].on = True
    x,y = RGBtoXY(0, 0, 0)
    bridge.set_light('Big lamp', 'xy', [x,y])
    # to get the scene id
    #print(json.dumps(bridge.get_scene(), indent=2))
    bridge.activate_scene("1", "Fo0TM840Hsy0wcG")