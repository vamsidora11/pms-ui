import React from "react";
 
function mergeClasses(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}
 
export function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={mergeClasses(
        "bg-white text-gray-900 flex flex-col gap-6 rounded-xl border shadow-sm",
        className
      )}
      {...props}
    />
  );
}
 
export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={mergeClasses(
        "grid auto-rows-min gap-1.5 px-6 pt-6",
        className
      )}
      {...props}
    />
  );
}
 
export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="card-title"
      className={mergeClasses("text-lg font-semibold leading-none", className)}
      {...props}
    />
  );
}
 
export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={mergeClasses("text-gray-500 text-sm", className)}
      {...props}
    />
  );
}
 
export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={mergeClasses("px-6", className)}
      {...props}
    />
  );
}
 
export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={mergeClasses("flex items-center px-6 pb-6", className)}
      {...props}
    />
  );
}
 