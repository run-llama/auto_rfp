import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            #1 RFP response software loved by customers
          </h2>
          <p className="max-w-[800px] text-muted-foreground md:text-xl">
            See how companies like yours are saving time and winning more deals with AutoRFP
          </p>
        </div>

        <div className="grid gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        className="text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-lg font-medium">
                    &quot;For every $1 that our company invests in AutoRFP, I estimate a return on investment of $500. We have seen really massive growth over the past few years and we couldn&apos;t have done it without AutoRFP.&quot;
                  </blockquote>
                </div>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                    <AvatarImage src="/avatar-1.png" />
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Jane Doe</p>
                    <p className="text-sm text-muted-foreground">
                      Global Director of Proposals at TechCorp
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-3xl font-bold">$5M</p>
                    <p className="text-sm text-muted-foreground">
                      saved in response cost
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">15,000</p>
                    <p className="text-sm text-muted-foreground">
                      hours saved in response time
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        className="text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-lg font-medium">
                    &quot;We were able to reduce the time maintaining our content library by 50% through the elimination of writing/editing tasks involved in each RFP response, and AI Assistant has contributed to our increasing win rate.&quot;
                  </blockquote>
                </div>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>JB</AvatarFallback>
                    <AvatarImage src="/avatar-2.png" />
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">John Brown</p>
                    <p className="text-sm text-muted-foreground">
                      Senior Specialist RFx Enablement at SalesForce
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-3xl font-bold">10x</p>
                    <p className="text-sm text-muted-foreground">
                      return on investment
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">50%</p>
                    <p className="text-sm text-muted-foreground">
                      time reduction
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                        className="text-yellow-500"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="text-lg font-medium">
                    &quot;It could take 5 to 10 minutes to manually find something in the library or to take two things and merge them together. With AI Assistant, it is actually answering, on average, our questions in 30 seconds.&quot;
                  </blockquote>
                </div>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>AH</AvatarFallback>
                    <AvatarImage src="/avatar-3.png" />
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Alexander Heart</p>
                    <p className="text-sm text-muted-foreground">
                      Senior Director of Solution Consulting at HealthTech
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-3xl font-bold">60%</p>
                    <p className="text-sm text-muted-foreground">
                      increase in proposals submitted
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">92%</p>
                    <p className="text-sm text-muted-foreground">
                      RFP go-forward rate
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg">
            See all customer stories
          </Button>
        </div>
      </div>
    </section>
  );
} 