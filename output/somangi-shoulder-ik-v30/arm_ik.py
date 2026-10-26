from mathutils import Vector,Matrix
import math

def solve(shoulder,elbow,palm,target,sign):
    upper=(elbow-shoulder).length;lower=(palm-elbow).length
    delta=target-shoulder;distance=min(delta.length,(upper+lower)*.995);direction=delta.normalized()
    along=(upper*upper-lower*lower+distance*distance)/(2*distance)
    height=math.sqrt(max(0,upper*upper-along*along))
    pole=Vector((sign,0,0));perpendicular=(pole-direction*pole.dot(direction)).normalized()
    joint=shoulder+direction*along+perpendicular*height
    actual=shoulder+direction*distance
    q1=(elbow-shoulder).rotation_difference(joint-shoulder)
    q2=(palm-elbow).rotation_difference(actual-joint)
    first=Matrix.Translation(shoulder)@q1.to_matrix().to_4x4()@Matrix.Translation(-shoulder)
    second=Matrix.Translation(joint)@q2.to_matrix().to_4x4()@Matrix.Translation(-elbow)
    return first,second,actual
